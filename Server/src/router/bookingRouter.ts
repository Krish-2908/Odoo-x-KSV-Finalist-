import { Router } from 'express'
import bookingController from '../controllers/bookingController.js'
import authenticate from '../middlewares/authenticate.js'

const router = Router()

router.use(authenticate)

// Passenger
router.post('/', bookingController.createBooking)
router.get('/', bookingController.getMyBookings)

// Driver
router.get('/driver', bookingController.getDriverBookings)
router.put('/:id/status', bookingController.updateBookingStatus)

export default router
