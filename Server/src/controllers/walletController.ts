import type { Request, Response } from 'express'
import { type AuthRequest } from '../middlewares/authenticate.js'
import Wallet from '../models/Wallet.js'
import httpResponse from '../utils/httpResponse.js'
import responseMessage from '../constant/responseMessage.js'
import HttpException from '../utils/httpException.js'
import asyncHandler from '../utils/asyncHandler.js'

// Allowed top-up amounts (simulated top-up since no real payment gateway)
const ALLOWED_TOPUP_AMOUNTS = [100, 200, 500, 1000, 2000, 5000]

export default {
    // GET /wallet - Get current wallet balance and recent transactions
    getWallet: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        if (!authReq.user) throw new HttpException(401, responseMessage.UNAUTHORIZED)

        let wallet = await Wallet.findOne({ employeeId: authReq.user._id })

        // Auto-create wallet if missing
        if (!wallet) {
            wallet = await Wallet.create({
                employeeId: authReq.user._id,
                balance: 0,
                transactions: []
            })
        }

        httpResponse(req, res, 200, responseMessage.SUCCESS, wallet)
    }),

    // POST /wallet/topup - Add funds to wallet
    topUpWallet: asyncHandler(async (req: Request, res: Response) => {
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
                `Top-up amount must be one of: ${ALLOWED_TOPUP_AMOUNTS.join(', ')}.`
            )
        }

        let wallet = await Wallet.findOne({ employeeId: authReq.user._id })

        if (!wallet) {
            wallet = await Wallet.create({
                employeeId: authReq.user._id,
                balance: 0,
                transactions: []
            })
        }

        wallet.balance += parsedAmount
        wallet.transactions.push({
            amount: parsedAmount,
            type: 'Credit',
            description: `Wallet top-up of $${parsedAmount}`
        })
        await wallet.save()

        httpResponse(req, res, 200, `Wallet topped up by $${parsedAmount} successfully.`, wallet)
    }),

    // POST /wallet/withdraw - Withdraw funds from wallet (admin simulation)
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
            throw new HttpException(400, `Insufficient balance. Current balance: $${wallet.balance}.`)
        }

        wallet.balance -= parsedAmount
        wallet.transactions.push({
            amount: parsedAmount,
            type: 'Debit',
            description: description || `Manual debit of $${parsedAmount}`
        })
        await wallet.save()

        httpResponse(req, res, 200, `$${parsedAmount} withdrawn from wallet.`, wallet)
    }),

    // GET /wallet/transactions - Transaction history (paginated)
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
