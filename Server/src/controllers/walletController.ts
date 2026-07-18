import Razorpay from 'razorpay'
import crypto from 'crypto'
import type { Request, Response } from 'express'
import { type AuthRequest } from '../middlewares/authenticate.js'
import Wallet from '../models/Wallet.js'
import Booking from '../models/Booking.js'
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

        // Razorpay receipt: max 40 chars
        const receipt = `wu_${String(authReq.user._id).slice(-8)}_${Date.now().toString().slice(-8)}`

        let order
        try {
            order = await razorpay.orders.create({
                amount: parsedAmount * 100, // paise
                currency: 'INR',
                receipt,
                notes: { purpose: 'wallet_topup' }
            })
        } catch (rzpErr: any) {
            const msg =
                rzpErr?.error?.description ||
                rzpErr?.error?.reason ||
                rzpErr?.message ||
                'Razorpay order creation failed. Please check your API keys.'
            throw new HttpException(502, msg)
        }

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
    }),

    // ─────────────────────────────────────────────────────────────────────────
    // RIDE-FARE PAYMENT FLOW (separate from wallet top-up)
    // ─────────────────────────────────────────────────────────────────────────

    // POST /wallet/ride-payment/order
    // Creates a Razorpay order for exactly the ride fare.
    // No amount allowlist — accepts any positive fare.
    createRidePaymentOrder: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        if (!authReq.user) throw new HttpException(401, responseMessage.UNAUTHORIZED)

        const { bookingId } = req.body

        if (!bookingId) throw new HttpException(400, 'bookingId is required.')

        const booking = await Booking.findById(bookingId).populate('rideId')
        if (!booking) throw new HttpException(404, responseMessage.NOT_FOUND('Booking'))
        if (String(booking.passengerId) !== String(authReq.user._id)) {
            throw new HttpException(403, 'You are not the passenger of this booking.')
        }
        if (booking.status !== 'Completed') {
            throw new HttpException(400, 'Ride must be completed before payment.')
        }

        const fare = booking.fareTotal
        if (!fare || fare <= 0) throw new HttpException(400, 'Invalid fare amount on booking.')

        // Razorpay receipt: max 40 chars
        const receipt = `rf_${String(bookingId).slice(-10)}_${Date.now().toString().slice(-8)}`

        let order
        try {
            order = await razorpay.orders.create({
                amount: Math.round(fare * 100), // paise (integer)
                currency: 'INR',
                receipt,
                notes: {
                    bookingId: String(bookingId),
                    purpose: 'ride_fare_payment'
                }
            })
        } catch (rzpErr: any) {
            const msg =
                rzpErr?.error?.description ||
                rzpErr?.error?.reason ||
                rzpErr?.message ||
                'Razorpay order creation failed. Please check your API keys.'
            throw new HttpException(502, msg)
        }

        httpResponse(req, res, 201, 'Ride fare order created.', {
            orderId: order.id,
            amount: fare,
            amountInPaise: Math.round(fare * 100),
            currency: 'INR',
            key: config.RAZORPAY_KEY_ID,
            bookingId
        })
    }),

    // POST /wallet/ride-payment/verify
    // Verifies Razorpay HMAC signature, then:
    //   1. Credits driver's wallet with the fare amount
    //   2. Records debit on passenger's wallet (audit trail)
    //   3. Does NOT change booking status (already Completed)
    verifyRidePayment: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        if (!authReq.user) throw new HttpException(401, responseMessage.UNAUTHORIZED)

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
            throw new HttpException(400, 'Missing required payment verification fields.')
        }

        // HMAC-SHA256 verification
        const expectedSig = crypto
            .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex')

        if (expectedSig !== razorpay_signature) {
            throw new HttpException(400, 'Payment verification failed. Invalid or tampered signature.')
        }

        // Fetch booking
        const booking = await Booking.findById(bookingId).populate({
            path: 'rideId',
            select: 'driverId',
            populate: { path: 'driverId', select: 'name' }
        })
        if (!booking) throw new HttpException(404, responseMessage.NOT_FOUND('Booking'))
        if (String(booking.passengerId) !== String(authReq.user._id)) {
            throw new HttpException(403, 'You are not the passenger of this booking.')
        }

        const fare = booking.fareTotal
        const ride = booking.rideId as any
        const driverId = ride?.driverId?._id ?? ride?.driverId

        if (!driverId) throw new HttpException(400, 'Unable to resolve driver for this ride.')

        // 1. Credit driver's wallet
        let driverWallet = await Wallet.findOne({ employeeId: driverId })
        if (!driverWallet) {
            driverWallet = await Wallet.create({ employeeId: driverId, balance: 0, transactions: [] })
        }
        driverWallet.balance += fare
        driverWallet.transactions.push({
            amount: fare,
            type: 'Credit',
            description: `Ride fare received from passenger (Razorpay) — Payment ID: ${razorpay_payment_id}`
        })
        await driverWallet.save()

        // 2. Record debit on passenger's wallet (audit trail — balance not deducted since they paid via Razorpay)
        let passengerWallet = await Wallet.findOne({ employeeId: authReq.user._id })
        if (!passengerWallet) {
            passengerWallet = await Wallet.create({ employeeId: authReq.user._id, balance: 0, transactions: [] })
        }
        passengerWallet.transactions.push({
            amount: fare,
            type: 'Debit',
            description: `Ride fare paid via Razorpay — Payment ID: ${razorpay_payment_id}`
        })
        await passengerWallet.save()

        httpResponse(req, res, 200, `Ride fare of ₹${fare} paid successfully. Driver wallet credited.`, {
            amountPaid: fare,
            paymentId: razorpay_payment_id,
            driverCredited: true
        })
    })
}

