class HMACAuthError extends Error {
    code: string;
    status: number;
    statusCode: number;
    status_code: number;

    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
        this.code = 'ERR_HMAC_AUTH_INVALID';
        Error.captureStackTrace(this, this.constructor);

        // provide an http status code 401 for all common error handling middlewares
        this.status = 401;
        this.statusCode = 401;
        this.status_code = 401;
    }
}

export { HMACAuthError };