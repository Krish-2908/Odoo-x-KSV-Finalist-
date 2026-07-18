import { Router } from 'express';
const router = Router();
router.get('/', (_req, res) => {
    res.json({ message: 'Wallet router working' });
});
export default router;
//# sourceMappingURL=walletRouter.js.map