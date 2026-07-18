import httpResponse from '../utils/httpResponse.js';
import responseMessage from '../constant/responseMessage.js';
import httpError from '../utils/httpError.js';
export default {
    self: (req, res, next) => {
        try {
            httpResponse(req, res, 200, responseMessage.SUCCESS);
        }
        catch (error) {
            httpError(next, error, req, 500);
        }
    }
};
//# sourceMappingURL=apiController.js.map