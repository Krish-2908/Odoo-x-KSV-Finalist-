import type { Request, Response } from 'express'
import { type AuthRequest } from '../middlewares/authenticate.js'
import Employee from '../models/Employee.js'
import Vehicle from '../models/Vehicle.js'
import OrganizationSettings from '../models/OrganizationSettings.js'
import httpResponse from '../utils/httpResponse.js'
import responseMessage from '../constant/responseMessage.js'
import HttpException from '../utils/httpException.js'
import asyncHandler from '../utils/asyncHandler.js'

export default {
    getEmployees: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        if (!authReq.user) {
            throw new HttpException(401, responseMessage.UNAUTHORIZED)
        }

        const employees = await Employee.find({ companyId: authReq.user.companyId })
            .select('-passwordHash')
            .sort({ name: 1 })

        httpResponse(req, res, 200, responseMessage.SUCCESS, employees)
    }),

    toggleEmployeeStatus: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        const { id } = req.params
        const { status } = req.body

        if (!authReq.user) {
            throw new HttpException(401, responseMessage.UNAUTHORIZED)
        }

        if (!status || !['Active', 'Inactive'].includes(status)) {
            throw new HttpException(400, responseMessage.INVALID_INPUT)
        }

        if (id === authReq.user._id.toString()) {
            throw new HttpException(400, 'You cannot deactivate your own administrator account.')
        }

        const employee = await Employee.findOne({ _id: id as any, companyId: authReq.user.companyId })
        if (!employee) {
            throw new HttpException(404, responseMessage.NOT_FOUND('Employee'))
        }

        employee.status = status as 'Active' | 'Inactive'
        await employee.save()

        httpResponse(req, res, 200, 'Employee status updated successfully.', employee)
    }),

    getVehicles: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        if (!authReq.user) {
            throw new HttpException(401, responseMessage.UNAUTHORIZED)
        }

        // Fetch all vehicles owned by employees of this company
        const vehicles = await Vehicle.find({ companyId: authReq.user.companyId })
            .populate('ownerId', 'name email phone')
            .sort({ model: 1 })

        httpResponse(req, res, 200, responseMessage.SUCCESS, vehicles)
    }),

    getSettings: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        if (!authReq.user) {
            throw new HttpException(401, responseMessage.UNAUTHORIZED)
        }

        let settings = await OrganizationSettings.findOne({ companyId: authReq.user.companyId })
        if (!settings) {
            settings = await OrganizationSettings.create({
                companyId: authReq.user.companyId,
                fuelCostPerKm: 10,
                allowedPaymentMethods: ['Cash', 'Card', 'Wallet']
            })
        }

        httpResponse(req, res, 200, responseMessage.SUCCESS, settings)
    }),

    updateSettings: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        const { fuelCostPerKm, allowedPaymentMethods } = req.body

        if (!authReq.user) {
            throw new HttpException(401, responseMessage.UNAUTHORIZED)
        }

        if (typeof fuelCostPerKm !== 'number' || fuelCostPerKm <= 0) {
            throw new HttpException(400, 'Fuel cost per kilometer must be a positive number.')
        }

        if (!Array.isArray(allowedPaymentMethods) || allowedPaymentMethods.length === 0) {
            throw new HttpException(400, 'At least one payment method must be allowed.')
        }

        const settings = await OrganizationSettings.findOneAndUpdate(
            { companyId: authReq.user.companyId },
            { fuelCostPerKm, allowedPaymentMethods, updatedAt: new Date() },
            { new: true, upsert: true }
        )

        httpResponse(req, res, 200, 'Settings updated successfully.', settings)
    }),

    getParticipationReport: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        if (!authReq.user) {
            throw new HttpException(401, responseMessage.UNAUTHORIZED)
        }

        const companyId = authReq.user.companyId

        const totalEmployees = await Employee.countDocuments({ companyId })
        const activeEmployees = await Employee.countDocuments({ companyId, status: 'Active' })
        const inactiveEmployees = await Employee.countDocuments({ companyId, status: 'Inactive' })
        const totalVehicles = await Vehicle.countDocuments({ companyId })

        const stats = {
            totalEmployees,
            activeEmployees,
            inactiveEmployees,
            totalVehicles
        }

        httpResponse(req, res, 200, responseMessage.SUCCESS, stats)
    })
}
