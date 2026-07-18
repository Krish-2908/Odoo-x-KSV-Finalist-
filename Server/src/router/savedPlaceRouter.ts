import { Router } from 'express'
import savedPlaceController from '../controllers/savedPlaceController.js'
import authenticate from '../middlewares/authenticate.js'

const router = Router()

router.use(authenticate)

router.get('/', savedPlaceController.getSavedPlaces)
router.post('/', savedPlaceController.createSavedPlace)
router.put('/:id', savedPlaceController.updateSavedPlace)
router.delete('/:id', savedPlaceController.deleteSavedPlace)

export default router
