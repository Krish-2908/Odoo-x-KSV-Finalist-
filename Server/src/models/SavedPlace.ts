import mongoose, { Schema, Document } from 'mongoose'

export interface ISavedPlace extends Document {
    employeeId: mongoose.Types.ObjectId
    label: string          // e.g. "Home", "Office", "Gym"
    address: string
    coordinates: {
        lat: number
        lng: number
    }
    createdAt?: Date
    updatedAt?: Date
}

const SavedPlaceSchema = new Schema<ISavedPlace>(
    {
        employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
        label: { type: String, required: true, trim: true },
        address: { type: String, required: true, trim: true },
        coordinates: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true }
        }
    },
    { timestamps: true }
)

// Compound index: one label per employee (unique per user)
SavedPlaceSchema.index({ employeeId: 1, label: 1 }, { unique: true })

export default mongoose.model<ISavedPlace>('SavedPlace', SavedPlaceSchema)
