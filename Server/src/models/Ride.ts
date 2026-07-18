import mongoose, { Schema } from 'mongoose'

export interface IRide {
    driverId: mongoose.Types.ObjectId
    vehicleId: mongoose.Types.ObjectId
    pickupLocation: {
        address: string
        coordinates: [number, number] // [lng, lat]
    }
    destination: {
        address: string
        coordinates: [number, number] // [lng, lat]
    }
    travelDateTime: Date
    availableSeats: number
    totalSeats: number
    farePerSeat: number
    status: 'Active' | 'Cancelled' | 'Completed'
    recurring: {
        isRecurring: boolean
        days: string[]
    }
    routeGeoJSON?: string
}

const RideSchema = new Schema<IRide>({
    driverId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    pickupLocation: {
        address: { type: String, required: true },
        coordinates: { type: [Number], required: true } // [lng, lat]
    },
    destination: {
        address: { type: String, required: true },
        coordinates: { type: [Number], required: true } // [lng, lat]
    },
    travelDateTime: { type: Date, required: true },
    availableSeats: { type: Number, required: true },
    totalSeats: { type: Number, required: true },
    farePerSeat: { type: Number, required: true },
    status: { type: String, enum: ['Active', 'Cancelled', 'Completed'], default: 'Active' },
    recurring: {
        isRecurring: { type: Boolean, default: false },
        days: [{ type: String }]
    },
    routeGeoJSON: { type: String }
})

// Create spatial index for geo queries
RideSchema.index({ 'pickupLocation.coordinates': '2dsphere' })
RideSchema.index({ 'destination.coordinates': '2dsphere' })

export default mongoose.model<IRide>('Ride', RideSchema)
