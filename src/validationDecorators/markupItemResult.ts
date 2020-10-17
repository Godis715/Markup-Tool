import { registerDecorator, ValidationOptions, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { Markup, MarkupType } from '../entity/Markup';
import Ajv from "ajv";
const ajv = new Ajv({ allErrors: true });

const coordSchema = {
    type: "number",
    minimum: 0
};

// JSON-схемы для результатов разметки различных типов
const schemas = {
    [MarkupType.CLASSIFICATION]: {
        type: "string"
    },
    [MarkupType.RECOGNITION]: {
        type: "object",
        additionalProperties: false,
        required: ["x1", "y1", "x2", "y2"],
        properties: {
            x1: coordSchema,
            y1: coordSchema,
            x2: coordSchema,
            y2: coordSchema
        }
    }
};

@ValidatorConstraint({ name: "markupItemResult", async: false })
export class MarkupItemResultConstraint implements ValidatorConstraintInterface {

    public message: string = null;

    public validate(value: any, args: ValidationArguments) {
        console.log("starting validate", value);
        const markup = (args.object as any)["markup"] as Markup;

        if (!markup) {
            return false;
        }

        const schema = schemas[markup.type];
        const isValid = ajv.validate(schema, value);

        console.log("isValid", isValid);

        if (!isValid) {
            this.message = ajv.errorsText();
            console.error(this.message);
            return false;
        }

        return true;
    }

    public defaultMessage(args: ValidationArguments) { // Set the default error message here
      return this.message;
    }

}

/**
 * Декоратор для проверки поля result в MarkupItem
 * В этом поле лежит json, схема которого зависит от type родительского markup
 */
export default function MarkupItemResult(validationOptions?: ValidationOptions) {
    return (object: Object, propertyName: string) => {
        registerDecorator({
            name: "markupItemResult",
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: ["markupItemResult"],
            validator: MarkupItemResultConstraint
        });
    }
}
