export default class HttpException extends Error {
    statusCode;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        // Fix prototype chain (important for instanceof)
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
//# sourceMappingURL=httpException.js.map