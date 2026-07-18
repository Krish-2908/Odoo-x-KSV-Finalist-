import httpError from './httpError.js';
export default function asyncHandler(fn) {
    return async function (req, res, next) {
        try {
            await fn(req, res, next);
        }
        catch (error) {
            httpError(next, error, req);
        }
    };
}
//# sourceMappingURL=asyncHandler.js.map