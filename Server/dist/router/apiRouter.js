import { Router } from 'express';
import apiController from '../controllers/apiController.js';
const router = Router();
router.get('/self', apiController.self);
export default router;
//# sourceMappingURL=apiRouter.js.map