import mongoose, { Schema } from 'mongoose'

export interface IBooking {
    passengerId: mongoose.Types.ObjectId
    rideId: mongoose.Types.ObjectId
    seatsBooked: number
    fareTotal: number
    paymentMethod: 'Cash' | 'Card' | 'UPI' | 'Wallet'
    status: 'Pending' | 'Confirmed' | 'Rejected' | 'Cancelled' | 'Completed'
    createdAt?: Date
}

const BookingSchema = new Schema<IBooking>(
    {
        passengerId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
        rideId: { type: Schema.Types.ObjectId, ref: 'Ride', required: true },
        seatsBooked: { type: Number, required: true, min: 1 },
        fareTotal: { type: Number, required: true },
        paymentMethod: {
            type: String,
            enum: ['Cash', 'Card', 'UPI', 'Wallet'],
            required: true
        },
        status: {
            type: String,
            enum: ['Pending', 'Confirmed', 'Rejected', 'Cancelled', 'Completed'],
            default: 'Pending'
        }
    },
    { timestamps: true }
)

export default mongoose.model<IBooking>('Booking', BookingSchema)
