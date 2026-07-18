import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import Employee from '../models/Employee.js'
import Company from '../models/Company.js'
import Wallet from '../models/Wallet.js'
import OrganizationSettings from '../models/OrganizationSettings.js'
import { generateToken } from '../utils/jwt.js'
import { type AuthRequest } from '../middlewares/authenticate.js'
import httpResponse from '../utils/httpResponse.js'
import responseMessage from '../constant/responseMessage.js'
import HttpException from '../utils/httpException.js'
import asyncHandler from '../utils/asyncHandler.js'

// Simple helper to seed a default company if none exist
const seedDefaultCompanyIfNeeded = async () => {
    const count = await Company.countDocuments()
    if (count === 0) {
        await Company.create({
            name: 'Odoo India',
            domain: 'odoo.com',
            address: 'Odoo House, Gandhinagar, Gujarat, India'
        })
    }
}

export default {
    getCompanies: asyncHandler(async (req: Request, res: Response) => {
        await seedDefaultCompanyIfNeeded()
        const companies = await Company.find().sort({ name: 1 })
        httpResponse(req, res, 200, responseMessage.SUCCESS, companies)
    }),

    register: asyncHandler(async (req: Request, res: Response) => {
        const { companyId, name, email, password, phone, role } = req.body

        if (!companyId || !name || !email || !password || !phone) {
            throw new HttpException(400, responseMessage.INVALID_INPUT)
        }

        if (password.length < 6) {
            throw new HttpException(400, 'Password must be at least 6 characters long.')
        }

        const company = await Company.findById(companyId)
        if (!company) {
            throw new HttpException(404, responseMessage.NOT_FOUND('Company'))
        }

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
            companyId,
            name,
            email: email.toLowerCase(),
            passwordHash,
            phone,
            role: role === 'Admin' ? 'Admin' : 'Employee',
            status: 'Active'
        })

        // Auto-initialize Wallet for Employees
        if (newEmployee.role === 'Employee') {
            await Wallet.create({
                employeeId: newEmployee._id,
                balance: 0
            })
        }

        // Auto-initialize Organization Settings for Admins if not present
        if (newEmployee.role === 'Admin') {
            const settingsExist = await OrganizationSettings.findOne({ companyId })
            if (!settingsExist) {
                await OrganizationSettings.create({
                    companyId,
                    fuelCostPerKm: 10,
                    allowedPaymentMethods: ['Cash', 'Card', 'Wallet']
                })
            }
        }

        // Exclude password hash from response
        const userObj = newEmployee.toObject()
        delete (userObj as any).passwordHash

        httpResponse(req, res, 201, responseMessage.SUCCESS, userObj)
    }),

    login: asyncHandler(async (req: Request, res: Response) => {
        const { email, password } = req.body

        if (!email || !password) {
            throw new HttpException(400, responseMessage.INVALID_INPUT)
        }

        const employee = await Employee.findOne({ email: email.toLowerCase() })
        if (!employee) {
            throw new HttpException(401, 'Invalid email or password.')
        }

        if (employee.status !== 'Active') {
            throw new HttpException(403, 'Your account is deactivated. Please contact your administrator.')
        }

        const isMatch = await bcrypt.compare(password, employee.passwordHash)
        if (!isMatch) {
            throw new HttpException(401, 'Invalid email or password.')
        }

        const token = generateToken({
            userId: (employee._id as any).toString(),
            role: employee.role,
            companyId: (employee.companyId as any).toString()
        })

        const userObj = employee.toObject()
        delete (userObj as any).passwordHash

        httpResponse(req, res, 200, responseMessage.SUCCESS, {
            token,
            user: userObj
        })
    }),

    me: asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest
        if (!authReq.user) {
            throw new HttpException(401, responseMessage.UNAUTHORIZED)
        }

        // Optionally populate company information
        const userPopulated = await Employee.findById(authReq.user._id).populate('companyId', 'name domain address')
        
        httpResponse(req, res, 200, responseMessage.SUCCESS, userPopulated)
    })
}
