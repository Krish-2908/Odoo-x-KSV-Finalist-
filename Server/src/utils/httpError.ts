import type { NextFunction, Request } from 'express'
import errorObject from './errorObject.js'

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export default (nextFunc: NextFunction, error: Error | unknown, req: Request, errorStatusCode: number = 500): void => {
    const errorObj = errorObject(error, req, errorStatusCode)
    return nextFunc(errorObj)
}
