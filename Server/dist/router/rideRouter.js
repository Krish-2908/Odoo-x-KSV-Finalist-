import { Router } from 'express';
const router = Router();
router.get('/', (_req, res) => {
    res.json({ message: 'Ride router working' });
});
export default router;
//# sourceMappingURL=rideRouter.js.map