import mongoose, { Schema, Document } from 'mongoose'

export interface ICompany extends Document {
    name: string
    domain: string
    address: string
    createdAt: Date
}

const CompanySchema = new Schema<ICompany>({
    name: { type: String, required: true, trim: true },
    domain: { type: String, required: true, unique: true, lowercase: true },
    address: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
})

export default mongoose.model<ICompany>('Company', CompanySchema)
