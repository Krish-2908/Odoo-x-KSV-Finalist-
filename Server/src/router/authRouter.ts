import { Router } from 'express'
import authController from '../controllers/authController.js'
import authenticate from '../middlewares/authenticate.js'

const router = Router()

router.get('/companies', authController.getCompanies)
router.post('/register', authController.register)
router.post('/login', authController.login)
router.get('/me', authenticate, authController.me)
router.put('/profile', authenticate, authController.updateProfile)

export default router
