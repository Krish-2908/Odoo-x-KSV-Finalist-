import mongoose, { Schema, Document } from 'mongoose';
const CompanySchema = new Schema({
    name: { type: String, required: true, trim: true },
    domain: { type: String, required: true, unique: true, lowercase: true },
    address: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
export default mongoose.model('Company', CompanySchema);
//# sourceMappingURL=Company.js.map