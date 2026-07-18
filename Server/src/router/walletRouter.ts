import { Router } from 'express'
import walletController from '../controllers/walletController.js'
import authenticate from '../middlewares/authenticate.js'

const router = Router()

router.use(authenticate)

router.get('/', walletController.getWallet)
router.post('/topup', walletController.topUpWallet)
router.post('/withdraw', walletController.withdrawWallet)
router.get('/transactions', walletController.getTransactions)

export default router
