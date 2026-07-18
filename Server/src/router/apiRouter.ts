import { Router } from 'express'
import apiController from '../controllers/apiController.js'
import rateLimit from '../middlewares/rateLimit.js'
import authRouter from './authRouter.js'
import adminRouter from './adminRouter.js'
import vehicleRouter from './vehicleRouter.js'
import rideRouter from './rideRouter.js'
import bookingRouter from './bookingRouter.js'
import tripRouter from './tripRouter.js'
import walletRouter from './walletRouter.js'
import savedPlaceRouter from './savedPlaceRouter.js'

const router = Router()

router.use(rateLimit)
router.get('/self', apiController.self)
router.get('/health', apiController.health)

// Mount routers
router.use('/auth', authRouter)
router.use('/admin', adminRouter)
router.use('/vehicles', vehicleRouter)
router.use('/rides', rideRouter)
router.use('/bookings', bookingRouter)
router.use('/trips', tripRouter)
router.use('/wallet', walletRouter)
router.use('/saved-places', savedPlaceRouter)

export default router
