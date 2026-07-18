import mongoose, { Schema } from 'mongoose'

export interface IVehicle {
    ownerId: mongoose.Types.ObjectId
    companyId: mongoose.Types.ObjectId
    model: string
    registrationNumber: string
    seatingCapacity: number
    fuelEfficiency: number
    isApproved: boolean
}

const VehicleSchema = new Schema<IVehicle>({
    ownerId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    model: { type: String, required: true },
    registrationNumber: { type: String, required: true, unique: true, uppercase: true },
    seatingCapacity: { type: Number, required: true, min: 1 },
    fuelEfficiency: { type: Number, required: true, default: 15 },
    isApproved: { type: Boolean, default: true }
})

export default mongoose.model<IVehicle>('Vehicle', VehicleSchema)
