import type { Request, Response, NextFunction } from 'express'
import type { THttpError } from '../types/types.js'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (error: THttpError, _: Request, res: Response, __: NextFunction) => {
    res.status(error.statusCode || 500).json(error)
}
