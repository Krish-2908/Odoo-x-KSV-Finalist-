import mongoose, { Schema, Document } from 'mongoose'

export interface IWallet extends Document {
    employeeId: mongoose.Types.ObjectId
    balance: number
}

const WalletSchema = new Schema<IWallet>({
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, unique: true },
    balance: { type: Number, required: true, default: 0 }
})

export default mongoose.model<IWallet>('Wallet', WalletSchema)
