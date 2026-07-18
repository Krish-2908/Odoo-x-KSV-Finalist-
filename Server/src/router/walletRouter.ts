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

// Razorpay wallet top-up flow (fixed allowlist: ₹100, 200, 500, 1000, 2000, 5000)
router.post('/order', walletController.createOrder)
router.post('/verify', walletController.verifyPayment)

// Razorpay RIDE-FARE payment flow (any positive fare, credits driver wallet)
router.post('/ride-payment/order', walletController.createRidePaymentOrder)
router.post('/ride-payment/verify', walletController.verifyRidePayment)

// Internal debit
router.post('/withdraw', walletController.withdrawWallet)

export default router
