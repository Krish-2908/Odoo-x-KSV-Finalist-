import type { Request, Response, NextFunction } from 'express'
import config from '../config/config.js'
import { EApplicationEnvironment } from '../constant/application.js'
import { rateLimiterMongo } from '../config/rateLimiter.js'
import httpError from '../utils/httpError.js'
import responseMessage from '../constant/responseMessage.js'

export default (req: Request, _: Response, next: NextFunction) => {
    if (config.ENV === EApplicationEnvironment.DEVELOPMENT) {
        return next()
    }

    if (rateLimiterMongo) {
        rateLimiterMongo
            .consume(req.ip as string, 1)
            .then(() => {
                next()
            })
            .catch(() => {
                httpError(next, new Error(responseMessage.TOO_MANY_REQUEST), req, 429)
            })
    }
}
