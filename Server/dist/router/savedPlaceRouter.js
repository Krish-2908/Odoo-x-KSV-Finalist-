import { Router } from 'express';
const router = Router();
router.get('/', (_req, res) => {
    res.json({ message: 'SavedPlace router working' });
});
export default router;
//# sourceMappingURL=savedPlaceRouter.js.map