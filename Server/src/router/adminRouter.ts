import { Router } from 'express'
import adminController from '../controllers/adminController.js'
import authenticate from '../middlewares/authenticate.js'
import authorizeAdmin from '../middlewares/authorizeAdmin.js'

const router = Router()

router.use(authenticate, authorizeAdmin)

router.get('/employees', adminController.getEmployees)
router.post('/employees', adminController.addEmployee)
router.put('/employees/:id/status', adminController.toggleEmployeeStatus)
router.get('/vehicles', adminController.getVehicles)
router.post('/vehicles', adminController.addVehicle)
router.get('/settings', adminController.getSettings)
router.put('/settings', adminController.updateSettings)
router.get('/reports/participation', adminController.getParticipationReport)
router.get('/trips', adminController.getCompanyTripHistory)

export default router
