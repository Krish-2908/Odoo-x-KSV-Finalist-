import mongoose, { Schema, Document } from 'mongoose'

export interface IEmployee extends Document {
    companyId: mongoose.Types.ObjectId
    name: string
    email: string
    passwordHash: string
    role: 'Admin' | 'Employee'
    status: 'Active' | 'Inactive'
    phone: string
    profilePicture?: string
    department?: string
    manager?: string
    officeLocation?: string
    createdAt: Date
}

const EmployeeSchema = new Schema<IEmployee>({
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['Admin', 'Employee'], default: 'Employee' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    phone: { type: String, required: true },
    profilePicture: { type: String },
    department: { type: String },
    manager: { type: String },
    officeLocation: { type: String },
    createdAt: { type: Date, default: Date.now }
})

export default mongoose.model<IEmployee>('Employee', EmployeeSchema)
