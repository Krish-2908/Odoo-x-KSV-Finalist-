import jwt from 'jsonwebtoken'
import config from '../config/config.js'

export interface TokenPayload {
    userId: string
    role: 'Admin' | 'Employee'
    companyId: string
}

export const generateToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, config.JWT_SECRET as string, {
        expiresIn: config.JWT_EXPIRY as any
    })
}

export const verifyToken = (token: string): TokenPayload => {
    return jwt.verify(token, config.JWT_SECRET as string) as TokenPayload
}
