export enum CustomErrorType {
    UNEXPECTED_ERROR = "UNEXPECTED_ERROR",
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
    NOT_FOUND = "NOT_FOUND"
}

export class CustomError extends Error {
    public readonly type: CustomErrorType;
    public readonly original?: Error;

    constructor(type: CustomErrorType, original?: Error) {
        super(original?.message);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, CustomError.prototype);

        this.type = type;
        this.original = original;
    }
}

export class ErrorResult {
    public readonly isSuccess = false;
    public readonly error: CustomError;

    constructor(type: CustomErrorType, original?: Error) {
        this.error = new CustomError(type, original);
    }
}

export class SuccessResult<T> {
    public readonly isSuccess = true;
    public readonly data: T;

    constructor(data: T) {
        this.data = data;
    }
}

export type RequestResult<T> = Promise<SuccessResult<T>|ErrorResult>;

