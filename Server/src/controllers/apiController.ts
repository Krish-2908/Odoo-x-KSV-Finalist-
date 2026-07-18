import { type Request, type Response } from 'express'
import httpResponse from '../utils/httpResponse.js'
import responseMessage from '../constant/responseMessage.js'
import quicker from '../utils/quicker.js'
import asyncHandler from '../utils/asyncHandler.js'

export default {
    self: asyncHandler((req: Request, res: Response) => {
        httpResponse(req, res, 200, responseMessage.SUCCESS)
    }),
    health: asyncHandler((req: Request, res: Response) => {
        const healthData = {
            application: quicker.getApplicationHealth(),
            system: quicker.getSystemHelth(),
            timeStamp: Date.now()
        }
        httpResponse(req, res, 200, responseMessage.SUCCESS, healthData)
    })
}
