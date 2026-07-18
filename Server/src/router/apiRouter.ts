import { Router } from 'express'
import apiController from '../controllers/apiController.js'
import rateLimit from '../middlewares/rateLimit.js'

const router = Router()

router.use(rateLimit)
router.get('/self', apiController.self)
router.get('/health', apiController.health)

export default router
