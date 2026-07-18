import { Router } from 'express'
import rideController from '../controllers/rideController.js'
import authenticate from '../middlewares/authenticate.js'

const router = Router()

router.use(authenticate)

router.get('/', rideController.searchRides)
router.post('/', rideController.publishRide)
router.get('/:id', rideController.getRideDetails)

export default router
