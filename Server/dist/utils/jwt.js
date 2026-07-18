import jwt from 'jsonwebtoken';
import config from '../config/config.js';
export const generateToken = (payload) => {
    return jwt.sign(payload, config.JWT_SECRET, {
        expiresIn: config.JWT_EXPIRY
    });
};
export const verifyToken = (token) => {
    return jwt.verify(token, config.JWT_SECRET);
};
//# sourceMappingURL=jwt.js.map