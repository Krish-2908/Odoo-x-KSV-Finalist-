import { verifyToken } from '../utils/jwt.js';
import Employee, {} from '../models/Employee.js';
import HttpException from '../utils/httpException.js';
import httpError from '../utils/httpError.js';
import responseMessage from '../constant/responseMessage.js';
export default async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new HttpException(401, responseMessage.UNAUTHORIZED);
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            throw new HttpException(401, responseMessage.UNAUTHORIZED);
        }
        let decoded;
        try {
            decoded = verifyToken(token);
        }
        catch (error) {
            throw new HttpException(401, responseMessage.UNAUTHORIZED);
        }
        const employee = await Employee.findById(decoded.userId);
        if (!employee) {
            throw new HttpException(401, responseMessage.UNAUTHORIZED);
        }
        if (employee.status !== 'Active') {
            throw new HttpException(403, responseMessage.FORBIDDEN);
        }
        ;
        req.user = employee;
        next();
    }
    catch (error) {
        httpError(next, error, req, error instanceof HttpException ? error.statusCode : 401);
    }
};
//# sourceMappingURL=authenticate.js.map