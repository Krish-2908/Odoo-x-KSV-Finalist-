import { Router } from 'express'

const router = Router()

router.get('/', (_req, res) => {
    res.json({ message: 'Trip router working' })
})

export default router
