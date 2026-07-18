import type { Request, Response } from 'express'
import { type AuthRequest } from '../middlewares/authenticate.js'
import Ride from '../models/Ride.js'
import Booking from '../models/Booking.js'
import Wallet from '../models/Wallet.js'
import httpResponse from '../utils/httpResponse.js'
import responseMessage from '../constant/responseMessage.js'
import HttpException from '../utils/httpException.js'
import asyncHandler from '../utils/asyncHandler.js'

export default {
    // POST /trips/:rideId/complete - Driver marks a ride as completed
    completeRide: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        if (!authReq.user) throw new HttpException(401, responseMessage.UNAUTHORIZED)

        const { rideId } = req.params

        const ride = await Ride.findOne({ _id: rideId as any, driverId: authReq.user._id })
        if (!ride) throw new HttpException(404, responseMessage.NOT_FOUND('Ride'))

        if (ride.status === 'Completed') {
            throw new HttpException(400, 'This ride is already marked as completed.')
        }
        if (ride.status === 'Cancelled') {
            throw new HttpException(400, 'A cancelled ride cannot be completed.')
        }

        // Mark ride as completed
        ride.status = 'Completed'
        await ride.save()

        // Mark all Confirmed bookings for this ride as Completed
        const confirmedBookings = await Booking.find({ rideId: ride._id, status: 'Confirmed' })

        for (const booking of confirmedBookings) {
            booking.status = 'Completed'
            await booking.save()

            // Credit driver wallet for each confirmed booking if payment method is Cash/Card/UPI
            // (Wallet payments were already deducted at confirm-time; we still credit driver)
            const driverWallet = await Wallet.findOne({ employeeId: authReq.user._id })
            if (driverWallet) {
                driverWallet.balance += booking.fareTotal
                driverWallet.transactions.push({
                    amount: booking.fareTotal,
                    type: 'Credit',
                    description: `Ride completed — earnings from ${(booking.passengerId as any)?.name ?? 'passenger'}`
                })
                await driverWallet.save()
            }
        }

        httpResponse(req, res, 200, 'Ride marked as completed. Earnings credited to your wallet.', {
            ride,
            completedBookings: confirmedBookings.length
        })
    }),

    // GET /trips/driver - Driver's trip history (completed/cancelled rides)
    getDriverTrips: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        if (!authReq.user) throw new HttpException(401, responseMessage.UNAUTHORIZED)

        const page = parseInt(String(req.query.page ?? '1'))
        const limit = parseInt(String(req.query.limit ?? '10'))
        const statusFilter = req.query.status as string | undefined

        const query: Record<string, any> = { driverId: authReq.user._id }
        if (statusFilter && ['Active', 'Completed', 'Cancelled'].includes(statusFilter)) {
            query.status = statusFilter
        }

        const total = await Ride.countDocuments(query)
        const rides = await Ride.find(query)
            .populate('vehicleId', 'model registrationNumber')
            .sort({ travelDateTime: -1 })
            .skip((page - 1) * limit)
            .limit(limit)

        // For each ride, attach booking summary
        const tripsWithBookings = await Promise.all(
            rides.map(async (ride) => {
                const bookings = await Booking.find({ rideId: ride._id })
                    .populate('passengerId', 'name email phone')
                    .sort({ createdAt: -1 })
                return { ride, bookings }
            })
        )

        httpResponse(req, res, 200, responseMessage.SUCCESS, { trips: tripsWithBookings, total, page, limit })
    }),

    // GET /trips/passenger - Passenger's trip history (completed bookings)
    getPassengerTrips: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        if (!authReq.user) throw new HttpException(401, responseMessage.UNAUTHORIZED)

        const page = parseInt(String(req.query.page ?? '1'))
        const limit = parseInt(String(req.query.limit ?? '10'))

        const total = await Booking.countDocuments({
            passengerId: authReq.user._id,
            status: { $in: ['Completed', 'Confirmed', 'Cancelled', 'Rejected'] }
        })

        const bookings = await Booking.find({
            passengerId: authReq.user._id,
            status: { $in: ['Completed', 'Confirmed', 'Cancelled', 'Rejected'] }
        })
            .populate({
                path: 'rideId',
                select: 'pickupLocation destination travelDateTime farePerSeat status driverId vehicleId',
                populate: [
                    { path: 'driverId', select: 'name email phone' },
                    { path: 'vehicleId', select: 'model registrationNumber' }
                ]
            })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)

        httpResponse(req, res, 200, responseMessage.SUCCESS, { trips: bookings, total, page, limit })
    }),

    // GET /trips/stats - Summary statistics for current user
    getStats: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        if (!authReq.user) throw new HttpException(401, responseMessage.UNAUTHORIZED)

        const uid = authReq.user._id

        // Driver stats
        const [totalRidesOffered, completedRides, cancelledRides] = await Promise.all([
            Ride.countDocuments({ driverId: uid }),
            Ride.countDocuments({ driverId: uid, status: 'Completed' }),
            Ride.countDocuments({ driverId: uid, status: 'Cancelled' })
        ])

        // Earnings from completed bookings on own rides
        const myRides = await Ride.find({ driverId: uid, status: 'Completed' }).select('_id')
        const rideIds = myRides.map((r) => r._id)
        const earningsResult = await Booking.aggregate([
            { $match: { rideId: { $in: rideIds }, status: 'Completed' } },
            { $group: { _id: null, total: { $sum: '$fareTotal' } } }
        ])
        const totalEarnings = earningsResult[0]?.total ?? 0
        const totalPassengersCarried = await Booking.countDocuments({ rideId: { $in: rideIds }, status: 'Completed' })

        // Passenger stats
        const [totalRidesBooked, completedBookings, cancelledBookings] = await Promise.all([
            Booking.countDocuments({ passengerId: uid }),
            Booking.countDocuments({ passengerId: uid, status: 'Completed' }),
            Booking.countDocuments({ passengerId: uid, status: { $in: ['Cancelled', 'Rejected'] } })
        ])

        const spendResult = await Booking.aggregate([
            { $match: { passengerId: uid, status: 'Completed' } },
            { $group: { _id: null, total: { $sum: '$fareTotal' } } }
        ])
        const totalSpent = spendResult[0]?.total ?? 0

        httpResponse(req, res, 200, responseMessage.SUCCESS, {
            driver: { totalRidesOffered, completedRides, cancelledRides, totalEarnings, totalPassengersCarried },
            passenger: { totalRidesBooked, completedBookings, cancelledBookings, totalSpent }
        })
    })
}
