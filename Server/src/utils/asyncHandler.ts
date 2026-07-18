import type { Request, Response, NextFunction, RequestHandler } from 'express'
import httpError from './httpError.js'

type AsyncController = (req: Request, res: Response, next: NextFunction) => Promise<void> | void

export default function asyncHandler(fn: AsyncController): RequestHandler {
    return async function (req: Request, res: Response, next: NextFunction) {
        try {
            await fn(req, res, next)
        } catch (error) {
            httpError(next, error, req)
        }
    }
}
