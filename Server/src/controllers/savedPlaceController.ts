import type { Request, Response } from 'express'
import { type AuthRequest } from '../middlewares/authenticate.js'
import SavedPlace from '../models/SavedPlace.js'
import httpResponse from '../utils/httpResponse.js'
import responseMessage from '../constant/responseMessage.js'
import HttpException from '../utils/httpException.js'
import asyncHandler from '../utils/asyncHandler.js'

export default {
    // GET /saved-places - List all saved places for current user
    getSavedPlaces: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        if (!authReq.user) throw new HttpException(401, responseMessage.UNAUTHORIZED)

        const places = await SavedPlace.find({ employeeId: authReq.user._id }).sort({ label: 1 })
        httpResponse(req, res, 200, responseMessage.SUCCESS, places)
    }),

    // POST /saved-places - Add a new saved place
    createSavedPlace: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        if (!authReq.user) throw new HttpException(401, responseMessage.UNAUTHORIZED)

        const { label, address, coordinates } = req.body

        if (!label || !address || !coordinates?.lat || !coordinates?.lng) {
            throw new HttpException(400, responseMessage.INVALID_INPUT)
        }

        // Check duplicate label for this user
        const existing = await SavedPlace.findOne({ employeeId: authReq.user._id, label: label.trim() })
        if (existing) {
            throw new HttpException(409, `You already have a saved place labelled "${label}". Use a different label.`)
        }

        const place = await SavedPlace.create({
            employeeId: authReq.user._id,
            label: label.trim(),
            address: address.trim(),
            coordinates
        })

        httpResponse(req, res, 201, 'Saved place added successfully.', place)
    }),

    // PUT /saved-places/:id - Update a saved place
    updateSavedPlace: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        if (!authReq.user) throw new HttpException(401, responseMessage.UNAUTHORIZED)

        const { id } = req.params
        const { label, address, coordinates } = req.body

        const place = await SavedPlace.findOne({ _id: id as any, employeeId: authReq.user._id })
        if (!place) throw new HttpException(404, responseMessage.NOT_FOUND('Saved place'))

        // Check duplicate label (exclude current doc)
        if (label && label.trim() !== place.label) {
            const duplicate = await SavedPlace.findOne({
                employeeId: authReq.user._id,
                label: label.trim(),
                _id: { $ne: id as any }
            })
            if (duplicate) {
                throw new HttpException(409, `You already have a saved place labelled "${label}".`)
            }
            place.label = label.trim()
        }

        if (address) place.address = address.trim()
        if (coordinates?.lat !== undefined) place.coordinates.lat = coordinates.lat
        if (coordinates?.lng !== undefined) place.coordinates.lng = coordinates.lng

        await place.save()

        httpResponse(req, res, 200, 'Saved place updated.', place)
    }),

    // DELETE /saved-places/:id - Delete a saved place
    deleteSavedPlace: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        if (!authReq.user) throw new HttpException(401, responseMessage.UNAUTHORIZED)

        const { id } = req.params

        const place = await SavedPlace.findOneAndDelete({ _id: id as any, employeeId: authReq.user._id })
        if (!place) throw new HttpException(404, responseMessage.NOT_FOUND('Saved place'))

        httpResponse(req, res, 200, 'Saved place deleted.', null)
    })
}
