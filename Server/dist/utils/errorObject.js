import responseMessage from '../constant/responseMessage.js';
import config from '../config/config.js';
import { EApplicationEnvironment } from '../constant/application.js';
import logger from './logger.js';
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export default (error, req, errorStatusCode = 500) => {
    const errorObject = {
        success: false,
        statusCode: errorStatusCode,
        request: {
            ip: req.ip || null,
            method: req.method,
            url: req.originalUrl
        },
        message: error instanceof Error ? error.message || responseMessage.SOMETHING_WENT_WRONG : responseMessage.SOMETHING_WENT_WRONG,
        data: null,
        trace: error instanceof Error ? { error: error.stack } : null
    };
    // log
    logger.error(`Controller_Error`, {
        meta: errorObject
    });
    // production check
    if (config.ENV === EApplicationEnvironment.PRODUCTION) {
        delete errorObject.request.ip;
        delete errorObject.trace;
    }
    return errorObject;
};
//# sourceMappingURL=errorObject.js.map