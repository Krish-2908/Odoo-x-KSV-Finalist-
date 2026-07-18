import mongoose, { Schema, Document } from 'mongoose'

export interface ICompany extends Document {
    name: string
    domain: string
    address: string
    industry?: string
    contactInfo?: string
    createdAt: Date
}

const CompanySchema = new Schema<ICompany>(
    {
        name: { type: String, required: true, trim: true },
        domain: { type: String, required: true, unique: true, lowercase: true },
        address: { type: String, required: true },
        industry: { type: String },
        contactInfo: { type: String }
    },
    { timestamps: true }
)

export default mongoose.model<ICompany>('Company', CompanySchema)
