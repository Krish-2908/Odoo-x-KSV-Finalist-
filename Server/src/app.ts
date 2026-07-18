import express, { type Application, type NextFunction, type Request, type Response } from 'express'
import path from 'node:path'
import { fileURLToPath } from 'url'
import router from './router/apiRouter.js'
import globalErrorHandler from './middlewares/globalErrorHandler.js'
import responseMessage from './constant/responseMessage.js'
import httpError from './utils/httpError.js'
import helmet from 'helmet'
import cors from 'cors'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app: Application = express()

// middlewares
app.use(helmet())
app.use(express.json())
app.use(express.static(path.join(__dirname, '../', 'public')))
app.use(
    cors({
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        origin: ['http://localhost:5173'],
        credentials: true
    })
)

// Routes
app.use('/api/v1', router)

// 404 Handler
app.use((req: Request, _: Response, next: NextFunction) => {
    try {
        throw new Error(responseMessage.NOT_FOUND('endpoint'))
    } catch (error) {
        httpError(next, error, req, 404)
    }
})

// Global Error Handler
app.use(globalErrorHandler)

export default app
