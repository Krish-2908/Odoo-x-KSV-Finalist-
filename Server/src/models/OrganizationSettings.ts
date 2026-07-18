import mongoose, { Schema, Document } from 'mongoose'

export interface IOrganizationSettings extends Document {
    companyId: mongoose.Types.ObjectId
    fuelCostPerKm: number
    fuelCostPerLitre: number
    defaultCarpoolPolicy?: string
    allowedPaymentMethods: ('Cash' | 'Card' | 'UPI' | 'Wallet')[]
    updatedAt: Date
}

const OrganizationSettingsSchema = new Schema<IOrganizationSettings>({
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, unique: true },
    fuelCostPerKm: { type: Number, required: true, default: 10 },
    fuelCostPerLitre: { type: Number, required: true, default: 100 },
    defaultCarpoolPolicy: { type: String, default: 'Standard organization carpooling policy applies.' },
    allowedPaymentMethods: {
        type: [String],
        enum: ['Cash', 'Card', 'UPI', 'Wallet'],
        default: ['Cash', 'Card', 'Wallet']
    },
    updatedAt: { type: Date, default: Date.now }
})

export default mongoose.model<IOrganizationSettings>('OrganizationSettings', OrganizationSettingsSchema)
