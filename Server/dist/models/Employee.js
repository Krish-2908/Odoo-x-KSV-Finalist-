import mongoose, { Schema, Document } from 'mongoose';
const EmployeeSchema = new Schema({
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['Admin', 'Employee'], default: 'Employee' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    phone: { type: String, required: true },
    profilePicture: { type: String },
    createdAt: { type: Date, default: Date.now }
});
export default mongoose.model('Employee', EmployeeSchema);
//# sourceMappingURL=Employee.js.map