export default class HttpException extends Error {
    public readonly statusCode: number

    constructor(statusCode: number, message: string) {
        super(message)
        this.statusCode = statusCode

        // Fix prototype chain (important for instanceof)
        Object.setPrototypeOf(this, new.target.prototype)
    }
}
