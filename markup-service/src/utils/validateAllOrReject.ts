import {
    validateOrReject,
    ValidatorOptions 
} from "class-validator";

export default async function validateAllOrReject(objects: any[], options?: ValidatorOptions) {
    return Promise.all(
        objects.map(
            (obj) => validateOrReject(obj, options)
        )
    );
}
