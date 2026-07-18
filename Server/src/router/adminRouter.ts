import { Router } from 'express'
import adminController from '../controllers/adminController.js'
import authenticate from '../middlewares/authenticate.js'
import authorizeAdmin from '../middlewares/authorizeAdmin.js'

const router = Router()

router.use(authenticate, authorizeAdmin)

router.get('/employees', adminController.getEmployees)
router.put('/employees/:id/status', adminController.toggleEmployeeStatus)
router.get('/vehicles', adminController.getVehicles)
router.get('/settings', adminController.getSettings)
router.put('/settings', adminController.updateSettings)
router.get('/reports/participation', adminController.getParticipationReport)

export default router
