import config from '../config/config.js';
import { EApplicationEnvironment } from '../constant/application.js';
import logger from './logger.js';
export default (req, res, responseStatusCode, responseMessage, data = null) => {
    const response = {
        success: true,
        statusCode: responseStatusCode,
        request: {
            ip: req.ip || null,
            method: req.method,
            url: req.originalUrl
        },
        message: responseMessage,
        data: data
    };
    // log
    logger.info(`Controller_Response`, {
        meta: response
    });
    // production check
    if (config.ENV === EApplicationEnvironment.PRODUCTION) {
        delete response.request.ip;
    }
    res.status(responseStatusCode).json(response);
};
//# sourceMappingURL=httpResponse.js.map