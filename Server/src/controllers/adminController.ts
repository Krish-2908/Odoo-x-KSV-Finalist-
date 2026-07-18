import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { type AuthRequest } from '../middlewares/authenticate.js'
import Employee from '../models/Employee.js'
import Vehicle from '../models/Vehicle.js'
import Company from '../models/Company.js'
import Wallet from '../models/Wallet.js'
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

    // POST /admin/employees - Register a new employee (Admin adds them, auto-creates wallet)
    addEmployee: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        if (!authReq.user) throw new HttpException(401, responseMessage.UNAUTHORIZED)

        const { name, email, password, phone, role, department, manager, officeLocation } = req.body

        if (!name || !email || !password || !phone) {
            throw new HttpException(400, responseMessage.INVALID_INPUT)
        }

        const company = await Company.findById(authReq.user.companyId)
        if (!company) throw new HttpException(404, 'Organization not found.')

        // Email domain verification
        const emailDomain = email.split('@')[1]
        if (!emailDomain || emailDomain.toLowerCase() !== company.domain.toLowerCase()) {
            throw new HttpException(400, `Registration email must belong to domain: @${company.domain}`)
        }

        // Check duplicate email
        const existingEmployee = await Employee.findOne({ email: email.toLowerCase() })
        if (existingEmployee) {
            throw new HttpException(409, 'Email address is already registered.')
        }

        const passwordHash = await bcrypt.hash(password, 10)

        const newEmployee = await Employee.create({
            companyId: authReq.user.companyId,
            name,
            email: email.toLowerCase(),
            passwordHash,
            phone,
            role: role === 'Admin' ? 'Admin' : 'Employee',
            status: 'Active',
            department,
            manager,
            officeLocation
        })

        // Auto-initialize Wallet for Employees
        if (newEmployee.role === 'Employee') {
            await Wallet.create({
                employeeId: newEmployee._id,
                balance: 0
            })
        }

        const userObj = newEmployee.toObject()
        delete (userObj as any).passwordHash

        httpResponse(req, res, 201, 'Employee registered successfully.', userObj)
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

        const vehicles = await Vehicle.find({ companyId: authReq.user.companyId })
            .populate('ownerId', 'name email phone')
            .sort({ model: 1 })

        httpResponse(req, res, 200, responseMessage.SUCCESS, vehicles)
    }),

    // POST /admin/vehicles - Register a vehicle on behalf of an employee
    addVehicle: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        if (!authReq.user) throw new HttpException(401, responseMessage.UNAUTHORIZED)

        const { ownerId, model, registrationNumber, seatingCapacity, fuelEfficiency } = req.body

        if (!ownerId || !model || !registrationNumber || !seatingCapacity || !fuelEfficiency) {
            throw new HttpException(400, responseMessage.INVALID_INPUT)
        }

        const owner = await Employee.findOne({ _id: ownerId as any, companyId: authReq.user.companyId })
        if (!owner) throw new HttpException(404, 'Employee owner not found.')

        // Check duplicate plate
        const existingVehicle = await Vehicle.findOne({ registrationNumber: registrationNumber.toUpperCase() })
        if (existingVehicle) {
            throw new HttpException(409, 'License plate is already registered under this platform.')
        }

        const vehicle = await Vehicle.create({
            ownerId,
            companyId: authReq.user.companyId,
            model,
            registrationNumber: registrationNumber.toUpperCase(),
            seatingCapacity,
            fuelEfficiency,
            isApproved: true
        })

        httpResponse(req, res, 201, 'Vehicle registered successfully.', vehicle)
    }),

    getSettings: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        if (!authReq.user) {
            throw new HttpException(401, responseMessage.UNAUTHORIZED)
        }

        const company = await Company.findById(authReq.user.companyId)
        let settings = await OrganizationSettings.findOne({ companyId: authReq.user.companyId })
        if (!settings) {
            settings = await OrganizationSettings.create({
                companyId: authReq.user.companyId,
                fuelCostPerKm: 10,
                fuelCostPerLitre: 100,
                defaultCarpoolPolicy: 'Standard organization carpooling policy applies.',
                allowedPaymentMethods: ['Cash', 'Card', 'Wallet']
            })
        }

        // Count total employees under this organization
        const totalEmployees = await Employee.countDocuments({ companyId: authReq.user.companyId })

        httpResponse(req, res, 200, responseMessage.SUCCESS, {
            settings,
            company: {
                name: company?.name,
                domain: company?.domain,
                address: company?.address,
                industry: company?.industry || '',
                contactInfo: company?.contactInfo || '',
                totalEmployees
            }
        })
    }),

    updateSettings: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        const {
            fuelCostPerKm,
            fuelCostPerLitre,
            defaultCarpoolPolicy,
            allowedPaymentMethods,
            companyName,
            companyAddress,
            companyIndustry,
            companyContactInfo
        } = req.body

        if (!authReq.user) {
            throw new HttpException(401, responseMessage.UNAUTHORIZED)
        }

        if (typeof fuelCostPerKm !== 'number' || fuelCostPerKm <= 0) {
            throw new HttpException(400, 'Fuel cost per kilometer must be a positive number.')
        }

        if (!Array.isArray(allowedPaymentMethods) || allowedPaymentMethods.length === 0) {
            throw new HttpException(400, 'At least one payment method must be allowed.')
        }

        // Update settings
        const settings = await OrganizationSettings.findOneAndUpdate(
            { companyId: authReq.user.companyId },
            {
                fuelCostPerKm,
                fuelCostPerLitre: fuelCostPerLitre || 100,
                defaultCarpoolPolicy: defaultCarpoolPolicy || '',
                allowedPaymentMethods,
                updatedAt: new Date()
            },
            { new: true, upsert: true }
        )

        // Update Company Details
        await Company.findByIdAndUpdate(authReq.user.companyId, {
            name: companyName,
            address: companyAddress,
            industry: companyIndustry,
            contactInfo: companyContactInfo
        })

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

