import type { Request, Response } from 'express'
import { type AuthRequest } from '../middlewares/authenticate.js'
import Booking from '../models/Booking.js'
import Ride from '../models/Ride.js'
import Wallet from '../models/Wallet.js'
import httpResponse from '../utils/httpResponse.js'
import responseMessage from '../constant/responseMessage.js'
import HttpException from '../utils/httpException.js'
import asyncHandler from '../utils/asyncHandler.js'

export default {
    // POST /bookings - Passenger requests a booking
    createBooking: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        if (!authReq.user) throw new HttpException(401, responseMessage.UNAUTHORIZED)

        const { rideId, seatsBooked, paymentMethod } = req.body

        if (!rideId || !seatsBooked || !paymentMethod) {
            throw new HttpException(400, responseMessage.INVALID_INPUT)
        }

        const ride = await Ride.findById(rideId)
        if (!ride) throw new HttpException(404, responseMessage.NOT_FOUND('Ride'))

        if (ride.status !== 'Active') {
            throw new HttpException(400, 'This ride is no longer available for booking.')
        }

        if (ride.driverId.toString() === authReq.user._id.toString()) {
            throw new HttpException(400, 'You cannot book a seat in your own ride.')
        }

        const seats = parseInt(seatsBooked)
        if (seats < 1) throw new HttpException(400, 'At least 1 seat must be booked.')
        if (seats > ride.availableSeats) {
            throw new HttpException(400, `Only ${ride.availableSeats} seat(s) are available.`)
        }

        // Check for duplicate active booking by same passenger
        const existingBooking = await Booking.findOne({
            rideId,
            passengerId: authReq.user._id,
            status: { $in: ['Pending', 'Confirmed'] }
        })
        if (existingBooking) {
            throw new HttpException(409, 'You already have an active booking for this ride.')
        }

        const fareTotal = ride.farePerSeat * seats

        // If paying by Wallet, verify balance
        if (paymentMethod === 'Wallet') {
            const wallet = await Wallet.findOne({ employeeId: authReq.user._id })
            if (!wallet || wallet.balance < fareTotal) {
                throw new HttpException(400, `Insufficient wallet balance. Required: $${fareTotal}, Available: $${wallet?.balance ?? 0}.`)
            }
        }

        // Decrement available seats immediately (to prevent over-booking while pending)
        ride.availableSeats = ride.availableSeats - seats
        if (ride.availableSeats === 0) {
            ride.status = 'Completed'
        }
        await ride.save()

        const booking = await Booking.create({
            passengerId: authReq.user._id,
            rideId,
            seatsBooked: seats,
            fareTotal,
            paymentMethod,
            status: 'Pending'
        })

        httpResponse(req, res, 201, 'Booking request sent successfully.', booking)
    }),

    // GET /bookings - Passenger's own bookings
    getMyBookings: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        if (!authReq.user) throw new HttpException(401, responseMessage.UNAUTHORIZED)

        const bookings = await Booking.find({ passengerId: authReq.user._id })
            .populate({
                path: 'rideId',
                select: 'pickupLocation destination travelDateTime farePerSeat status driverId vehicleId',
                populate: [
                    { path: 'driverId', select: 'name email phone' },
                    { path: 'vehicleId', select: 'model registrationNumber' }
                ]
            })
            .sort({ createdAt: -1 })

        httpResponse(req, res, 200, responseMessage.SUCCESS, bookings)
    }),

    // GET /bookings/driver - Driver sees all booking requests for their rides
    getDriverBookings: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        if (!authReq.user) throw new HttpException(401, responseMessage.UNAUTHORIZED)

        // Find all rides driven by current user
        const myRides = await Ride.find({ driverId: authReq.user._id }).select('_id')
        const rideIds = myRides.map((r) => r._id)

        const bookings = await Booking.find({ rideId: { $in: rideIds } })
            .populate('passengerId', 'name email phone')
            .populate({
                path: 'rideId',
                select: 'pickupLocation destination travelDateTime farePerSeat'
            })
            .sort({ createdAt: -1 })

        httpResponse(req, res, 200, responseMessage.SUCCESS, bookings)
    }),

    // PUT /bookings/:id/status - Driver confirms/rejects OR passenger cancels
    updateBookingStatus: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        if (!authReq.user) throw new HttpException(401, responseMessage.UNAUTHORIZED)

        const { status } = req.body
        const { id } = req.params

        if (!['Confirmed', 'Rejected', 'Cancelled'].includes(status)) {
            throw new HttpException(400, 'Status must be Confirmed, Rejected, or Cancelled.')
        }

        const booking = await Booking.findById(id as any).populate('rideId')
        if (!booking) throw new HttpException(404, responseMessage.NOT_FOUND('Booking'))

        const ride = booking.rideId as any

        const isDriver = ride.driverId.toString() === authReq.user._id.toString()
        const isPassenger = booking.passengerId.toString() === authReq.user._id.toString()

        // Passenger can only cancel their own pending booking
        if (status === 'Cancelled') {
            if (!isPassenger) {
                throw new HttpException(403, responseMessage.FORBIDDEN)
            }
            if (!['Pending', 'Confirmed'].includes(booking.status)) {
                throw new HttpException(400, 'Only pending or confirmed bookings can be cancelled.')
            }
            // Restore seats to ride
            await Ride.findByIdAndUpdate(ride._id, {
                $inc: { availableSeats: booking.seatsBooked },
                status: 'Active'
            })
            booking.status = 'Cancelled'
            await booking.save()
            return httpResponse(req, res, 200, 'Booking cancelled successfully.', booking)
        }

        // Driver can confirm or reject
        if (!isDriver) {
            throw new HttpException(403, responseMessage.FORBIDDEN)
        }

        if (booking.status !== 'Pending') {
            throw new HttpException(400, 'Only pending bookings can be accepted or rejected.')
        }

        // If rejected, restore available seats
        if (status === 'Rejected') {
            await Ride.findByIdAndUpdate(ride._id, {
                $inc: { availableSeats: booking.seatsBooked },
                status: 'Active'
            })
        }

        // If confirmed and wallet payment, deduct wallet balance
        if (status === 'Confirmed' && booking.paymentMethod === 'Wallet') {
            const wallet = await Wallet.findOne({ employeeId: booking.passengerId })
            if (!wallet || wallet.balance < booking.fareTotal) {
                throw new HttpException(400, `Passenger has insufficient wallet balance for this booking.`)
            }
            wallet.balance -= booking.fareTotal
            await wallet.save()
        }

        booking.status = status as 'Confirmed' | 'Rejected'
        await booking.save()

        httpResponse(req, res, 200, `Booking ${status.toLowerCase()} successfully.`, booking)
    })
}
