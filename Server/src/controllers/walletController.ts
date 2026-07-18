import Razorpay from 'razorpay'
import crypto from 'crypto'
import type { Request, Response } from 'express'
import { type AuthRequest } from '../middlewares/authenticate.js'
import Wallet from '../models/Wallet.js'
import httpResponse from '../utils/httpResponse.js'
import responseMessage from '../constant/responseMessage.js'
import HttpException from '../utils/httpException.js'
import asyncHandler from '../utils/asyncHandler.js'
import config from '../config/config.js'

// Initialise Razorpay instance with test-mode keys
const razorpay = new Razorpay({
    key_id: config.RAZORPAY_KEY_ID,
    key_secret: config.RAZORPAY_KEY_SECRET
})

const ALLOWED_TOPUP_AMOUNTS = [100, 200, 500, 1000, 2000, 5000]

export default {
    // GET /wallet/razorpay-key — expose public key to frontend (safe, key_id only)
    getRazorpayKey: asyncHandler(async (req: Request, res: Response) => {
        httpResponse(req, res, 200, responseMessage.SUCCESS, {
            key: config.RAZORPAY_KEY_ID
        })
    }),

    // GET /wallet — Get current wallet balance and transactions
    getWallet: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        if (!authReq.user) throw new HttpException(401, responseMessage.UNAUTHORIZED)

        let wallet = await Wallet.findOne({ employeeId: authReq.user._id })
        if (!wallet) {
            wallet = await Wallet.create({
                employeeId: authReq.user._id,
                balance: 0,
                transactions: []
            })
        }

        httpResponse(req, res, 200, responseMessage.SUCCESS, wallet)
    }),

    // POST /wallet/order — Create a Razorpay order for wallet top-up
    createOrder: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        if (!authReq.user) throw new HttpException(401, responseMessage.UNAUTHORIZED)

        const { amount } = req.body
        const parsedAmount = Number(amount)

        if (!parsedAmount || parsedAmount <= 0) {
            throw new HttpException(400, 'Amount must be a positive number.')
        }
        if (!ALLOWED_TOPUP_AMOUNTS.includes(parsedAmount)) {
            throw new HttpException(
                400,
                `Top-up amount must be one of: ₹${ALLOWED_TOPUP_AMOUNTS.join(', ₹')}.`
            )
        }

        // Razorpay expects amount in paise (1 INR = 100 paise)
        const orderOptions = {
            amount: parsedAmount * 100,
            currency: 'INR',
            receipt: `wallet_topup_${authReq.user._id}_${Date.now()}`,
            notes: {
                employeeId: authReq.user._id.toString(),
                purpose: 'wallet_topup'
            }
        }

        const order = await razorpay.orders.create(orderOptions)

        httpResponse(req, res, 201, 'Razorpay order created.', {
            orderId: order.id,
            amount: parsedAmount,
            amountInPaise: parsedAmount * 100,
            currency: 'INR',
            key: config.RAZORPAY_KEY_ID
        })
    }),

    // POST /wallet/verify — Verify Razorpay payment signature and credit wallet
    verifyPayment: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        if (!authReq.user) throw new HttpException(401, responseMessage.UNAUTHORIZED)

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !amount) {
            throw new HttpException(400, 'Missing Razorpay payment verification fields.')
        }

        // HMAC-SHA256 signature verification
        const expectedSignature = crypto
            .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex')

        if (expectedSignature !== razorpay_signature) {
            throw new HttpException(400, 'Payment verification failed. Invalid or tampered signature.')
        }

        const creditAmount = Number(amount)

        // Credit the employee wallet
        let wallet = await Wallet.findOne({ employeeId: authReq.user._id })
        if (!wallet) {
            wallet = await Wallet.create({
                employeeId: authReq.user._id,
                balance: 0,
                transactions: []
            })
        }

        wallet.balance += creditAmount
        wallet.transactions.push({
            amount: creditAmount,
            type: 'Credit',
            description: `Wallet recharge via Razorpay (Test) — Payment ID: ${razorpay_payment_id}`
        })
        await wallet.save()

        httpResponse(req, res, 200, `₹${creditAmount} added to your wallet successfully.`, wallet)
    }),

    // POST /wallet/withdraw — Internal debit
    withdrawWallet: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        if (!authReq.user) throw new HttpException(401, responseMessage.UNAUTHORIZED)

        const { amount, description } = req.body
        const parsedAmount = Number(amount)

        if (!parsedAmount || parsedAmount <= 0) {
            throw new HttpException(400, 'Amount must be a positive number.')
        }

        const wallet = await Wallet.findOne({ employeeId: authReq.user._id })
        if (!wallet) throw new HttpException(404, 'Wallet not found.')
        if (wallet.balance < parsedAmount) {
            throw new HttpException(400, `Insufficient balance. Current balance: ₹${wallet.balance}.`)
        }

        wallet.balance -= parsedAmount
        wallet.transactions.push({
            amount: parsedAmount,
            type: 'Debit',
            description: description || `Manual debit of ₹${parsedAmount}`
        })
        await wallet.save()

        httpResponse(req, res, 200, `₹${parsedAmount} withdrawn from wallet.`, wallet)
    }),

    // GET /wallet/transactions — Paginated transaction history
    getTransactions: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        if (!authReq.user) throw new HttpException(401, responseMessage.UNAUTHORIZED)

        const page = parseInt(String(req.query.page ?? '1'))
        const limit = parseInt(String(req.query.limit ?? '20'))

        const wallet = await Wallet.findOne({ employeeId: authReq.user._id })
        if (!wallet) {
            return httpResponse(req, res, 200, responseMessage.SUCCESS, { transactions: [], total: 0 })
        }

        const allTxns = [...wallet.transactions].sort((a, b) => {
            const aDate = (a as any).createdAt?.getTime() ?? 0
            const bDate = (b as any).createdAt?.getTime() ?? 0
            return bDate - aDate
        })

        const total = allTxns.length
        const paginated = allTxns.slice((page - 1) * limit, page * limit)

        httpResponse(req, res, 200, responseMessage.SUCCESS, { transactions: paginated, total, page, limit })
    })
}
