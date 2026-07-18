import mongoose, { Schema, Document } from 'mongoose'

export interface IWalletTransaction {
    amount: number
    type: 'Credit' | 'Debit'
    description: string
    createdAt?: Date
}

export interface IWallet extends Document {
    employeeId: mongoose.Types.ObjectId
    balance: number
    transactions: IWalletTransaction[]
}

const WalletTransactionSchema = new Schema<IWalletTransaction>(
    {
        amount: { type: Number, required: true },
        type: { type: String, enum: ['Credit', 'Debit'], required: true },
        description: { type: String, required: true }
    },
    { timestamps: true }
)

const WalletSchema = new Schema<IWallet>(
    {
        employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, unique: true },
        balance: { type: Number, required: true, default: 0 },
        transactions: { type: [WalletTransactionSchema], default: [] }
    },
    { timestamps: true }
)

export default mongoose.model<IWallet>('Wallet', WalletSchema)
