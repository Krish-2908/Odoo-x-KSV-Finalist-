import { Router } from 'express'
import vehicleController from '../controllers/vehicleController.js'
import authenticate from '../middlewares/authenticate.js'

const router = Router()

router.use(authenticate)

router.get('/', vehicleController.getVehicles)
router.post('/', vehicleController.createVehicle)
router.put('/:id', vehicleController.updateVehicle)
router.delete('/:id', vehicleController.deleteVehicle)

export default router
