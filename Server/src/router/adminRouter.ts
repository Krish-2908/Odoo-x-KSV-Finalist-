import { Router } from 'express'

const router = Router()

router.get('/', (_req, res) => {
    res.json({ message: 'Admin router working' })
})

export default router
