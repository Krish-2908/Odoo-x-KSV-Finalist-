import { Router } from 'express'
import tripController from '../controllers/tripController.js'
import authenticate from '../middlewares/authenticate.js'

const router = Router()

router.use(authenticate)

// Stats summary
router.get('/stats', tripController.getStats)

// Driver
router.get('/driver', tripController.getDriverTrips)
router.post('/:rideId/complete', tripController.completeRide)

// Passenger
router.get('/passenger', tripController.getPassengerTrips)

export default router
