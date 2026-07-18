import type { Response, NextFunction } from 'express'
import type { AuthRequest } from './authenticate.js'
import HttpException from '../utils/httpException.js'
import httpError from '../utils/httpError.js'
import responseMessage from '../constant/responseMessage.js'

export default (req: AuthRequest, _res: Response, next: NextFunction): void => {
    try {
        if (!req.user || req.user.role !== 'Admin') {
            throw new HttpException(403, responseMessage.FORBIDDEN)
        }
        next()
    } catch (error) {
        httpError(next, error, req, 403)
    }
}
