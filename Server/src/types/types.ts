export type THttpResponse = {
    statusCode: number
    success: boolean
    message: string
    request: {
        method: string
        ip?: string | null
        url: string
    }
    data: unknown
}

export type THttpError = {
    statusCode: number
    success: boolean
    message: string
    request: {
        method: string
        ip?: string | null
        url: string
    }
    data: unknown
    trace?: object | null
}
