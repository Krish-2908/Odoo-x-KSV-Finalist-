import type { Request, Response } from 'express'
import { type AuthRequest } from '../middlewares/authenticate.js'
import Ride from '../models/Ride.js'
import Vehicle from '../models/Vehicle.js'
import httpResponse from '../utils/httpResponse.js'
import responseMessage from '../constant/responseMessage.js'
import HttpException from '../utils/httpException.js'
import asyncHandler from '../utils/asyncHandler.js'

export default {
    publishRide: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        if (!authReq.user) {
            throw new HttpException(401, responseMessage.UNAUTHORIZED)
        }

        const {
            vehicleId,
            pickupLocation,
            destination,
            travelDateTime,
            availableSeats,
            farePerSeat,
            recurring,
            routeGeoJSON
        } = req.body

        if (!vehicleId || !pickupLocation || !destination || !travelDateTime || !availableSeats || farePerSeat === undefined) {
            throw new HttpException(400, responseMessage.INVALID_INPUT)
        }

        // Validate vehicle ownership and seating capacity
        const vehicle = await Vehicle.findOne({ _id: vehicleId, ownerId: authReq.user._id })
        if (!vehicle) {
            throw new HttpException(404, 'Selected vehicle not found or does not belong to you.')
        }

        if (availableSeats > vehicle.seatingCapacity) {
            throw new HttpException(400, `Available seats cannot exceed vehicle's maximum seating capacity (${vehicle.seatingCapacity}).`)
        }

        const ride = await Ride.create({
            driverId: authReq.user._id,
            vehicleId,
            pickupLocation: {
                address: pickupLocation.address,
                coordinates: [parseFloat(pickupLocation.coordinates[0]), parseFloat(pickupLocation.coordinates[1])] // [lng, lat]
            },
            destination: {
                address: destination.address,
                coordinates: [parseFloat(destination.coordinates[0]), parseFloat(destination.coordinates[1])] // [lng, lat]
            },
            travelDateTime: new Date(travelDateTime),
            availableSeats: parseInt(availableSeats),
            totalSeats: parseInt(availableSeats),
            farePerSeat: parseFloat(farePerSeat),
            recurring: {
                isRecurring: !!recurring?.isRecurring,
                days: recurring?.days || []
            },
            routeGeoJSON: routeGeoJSON ? JSON.stringify(routeGeoJSON) : undefined,
            status: 'Active'
        } as any)

        httpResponse(req, res, 201, 'Ride published successfully.', ride)
    }),

    searchRides: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        if (!authReq.user) {
            throw new HttpException(401, responseMessage.UNAUTHORIZED)
        }

        const { date, seatsRequired } = req.query

        const seats = seatsRequired ? parseInt(seatsRequired as string) : 1
        const queryDate = date ? new Date(date as string) : new Date()

        // Start of day filter if searching specific date
        const startOfDay = new Date(queryDate)
        startOfDay.setHours(0, 0, 0, 0)
        
        const endOfDay = new Date(queryDate)
        endOfDay.setHours(23, 59, 59, 999)

        // Query criteria: must be active, must belong to coworkers of the same company, and have enough seats
        const filter: any = {
            status: 'Active',
            availableSeats: { $gte: seats },
            travelDateTime: { $gte: startOfDay }
        }

        // We can search coworkers by checking driverId. We will populate driver details and filter post-query, 
        // or join. However, since they belong to the same company, let's filter drivers who belong to req.user.companyId.
        // We will fetch drivers first, or populate and filter.
        // Even better, Mongoose populate with filter:
        const rides = await Ride.find(filter)
            .populate({
                path: 'driverId',
                match: { companyId: authReq.user.companyId },
                select: 'name email phone profilePicture'
            })
            .populate('vehicleId', 'model registrationNumber seatingCapacity')
            .sort({ travelDateTime: 1 })

        // Filter out rides whose driver is null (i.e. driver does not belong to the same company) or is the current user (cannot book own ride)
        const filteredRides = rides.filter(
            (r) => r.driverId !== null && (r.driverId as any)._id.toString() !== authReq.user!._id.toString()
        )

        // If coordinates are provided, we can sort or narrow by proximity
        // For the scope of hackathon local maps, displaying matching records on the queried date is highly robust.
        
        httpResponse(req, res, 200, responseMessage.SUCCESS, filteredRides)
    }),

    getRideDetails: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        if (!authReq.user) {
            throw new HttpException(401, responseMessage.UNAUTHORIZED)
        }

        const ride = await Ride.findById(req.params.id)
            .populate('driverId', 'name email phone profilePicture companyId')
            .populate('vehicleId', 'model registrationNumber seatingCapacity fuelEfficiency')

        if (!ride) {
            throw new HttpException(404, responseMessage.NOT_FOUND('Ride'))
        }

        // Verify coworker company check
        const driverCompanyId = (ride.driverId as any).companyId?.toString()
        if (driverCompanyId !== authReq.user.companyId.toString()) {
            throw new HttpException(403, responseMessage.FORBIDDEN)
        }

        httpResponse(req, res, 200, responseMessage.SUCCESS, ride)
    })
}
