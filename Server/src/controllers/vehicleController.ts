import type { Request, Response } from 'express'
import { type AuthRequest } from '../middlewares/authenticate.js'
import Vehicle from '../models/Vehicle.js'
import httpResponse from '../utils/httpResponse.js'
import responseMessage from '../constant/responseMessage.js'
import HttpException from '../utils/httpException.js'
import asyncHandler from '../utils/asyncHandler.js'

export default {
    getVehicles: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        if (!authReq.user) {
            throw new HttpException(401, responseMessage.UNAUTHORIZED)
        }

        const vehicles = await Vehicle.find({ ownerId: authReq.user._id })
            .sort({ createdAt: -1 })

        httpResponse(req, res, 200, responseMessage.SUCCESS, vehicles)
    }),

    createVehicle: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        if (!authReq.user) {
            throw new HttpException(401, responseMessage.UNAUTHORIZED)
        }

        const { model, registrationNumber, seatingCapacity, fuelEfficiency } = req.body

        if (!model || !registrationNumber || !seatingCapacity || !fuelEfficiency) {
            throw new HttpException(400, responseMessage.INVALID_INPUT)
        }

        const formattedReg = registrationNumber.trim().toUpperCase()

        // Check if registration number already exists
        const existingVehicle = await Vehicle.findOne({ registrationNumber: formattedReg })
        if (existingVehicle) {
            throw new HttpException(409, `Vehicle with registration plate ${formattedReg} is already registered.`)
        }

        const vehicle = await Vehicle.create({
            ownerId: authReq.user._id,
            companyId: authReq.user.companyId,
            model,
            registrationNumber: formattedReg,
            seatingCapacity,
            fuelEfficiency,
            isApproved: true
        })

        httpResponse(req, res, 201, 'Vehicle registered successfully.', vehicle)
    }),

    updateVehicle: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        const { id } = req.params
        const { model, registrationNumber, seatingCapacity, fuelEfficiency } = req.body

        if (!authReq.user) {
            throw new HttpException(401, responseMessage.UNAUTHORIZED)
        }

        if (!model || !registrationNumber || !seatingCapacity || !fuelEfficiency) {
            throw new HttpException(400, responseMessage.INVALID_INPUT)
        }

        const formattedReg = registrationNumber.trim().toUpperCase()

        // Check duplicate plate under other vehicles
        const existingVehicle = await Vehicle.findOne({
            registrationNumber: formattedReg,
            _id: { $ne: id as any }
        })
        if (existingVehicle) {
            throw new HttpException(409, `Another vehicle is already registered with registration number ${formattedReg}.`)
        }

        const vehicle = await Vehicle.findOne({ _id: id as any, ownerId: authReq.user._id })
        if (!vehicle) {
            throw new HttpException(404, responseMessage.NOT_FOUND('Vehicle'))
        }

        vehicle.model = model
        vehicle.registrationNumber = formattedReg
        vehicle.seatingCapacity = seatingCapacity
        vehicle.fuelEfficiency = fuelEfficiency
        await vehicle.save()

        httpResponse(req, res, 200, 'Vehicle updated successfully.', vehicle)
    }),

    deleteVehicle: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        const { id } = req.params

        if (!authReq.user) {
            throw new HttpException(401, responseMessage.UNAUTHORIZED)
        }

        const vehicle = await Vehicle.findOneAndDelete({ _id: id as any, ownerId: authReq.user._id })
        if (!vehicle) {
            throw new HttpException(404, responseMessage.NOT_FOUND('Vehicle'))
        }

        httpResponse(req, res, 200, 'Vehicle deleted successfully.', vehicle)
    })
}
