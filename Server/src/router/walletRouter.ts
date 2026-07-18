import { Router } from 'express'
import walletController from '../controllers/walletController.js'
import authenticate from '../middlewares/authenticate.js'

const router = Router()

router.use(authenticate)

// Public key (still authenticated — just reveals key_id, never key_secret)
router.get('/razorpay-key', walletController.getRazorpayKey)

// Balance & transactions
router.get('/', walletController.getWallet)
router.get('/transactions', walletController.getTransactions)

// Razorpay payment flow
router.post('/order', walletController.createOrder)
router.post('/verify', walletController.verifyPayment)

// Internal debit
router.post('/withdraw', walletController.withdrawWallet)

export default router
