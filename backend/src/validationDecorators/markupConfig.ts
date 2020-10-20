import {
    registerDecorator,
    ValidationOptions,
    ValidationArguments,
    ValidatorConstraint,
    ValidatorConstraintInterface
} from 'class-validator';
import Ajv from "ajv";
import { MarkupType } from '../enums/appEnums';
import { Markup } from '../entity/Markup';

// JSON-схемы для параметров разметки различных типов
const schemas = {
    [MarkupType.CLASSIFICATION]: {
        type: "array",
        uniqueItems: true,
        minItems: 2,
        items: {
            type: "string"
        }
    }
};

@ValidatorConstraint({ name: "markupConfig", async: false })
export class MarkupConfigConstraint implements ValidatorConstraintInterface {
    public message: string = null;

    public validate(value: any, args: ValidationArguments) {
        const markup = args.object as Markup;

        if (!markup) {
            return false;
        }

        const schema = schemas[markup.type];

        /**
         * Если схема не определена,
         * тогда и значение должно быть не определено
         * (по задумке)
         */
        if (!schema) {
            return !value;
        }

        const ajv = new Ajv({ allErrors: true });
        const isValid = ajv.validate(schema, value);

        if (!isValid) {
            this.message = ajv.errorsText();
            console.error(this.message);
            return false;
        }

        return true;
    }

    public defaultMessage(args: ValidationArguments) {
      return `Markup's config has wrong format: ${this.message}`;
    }
}

/**
 * Декоратор для проверки поля result в MarkupItem
 * В этом поле лежит json, схема которого зависит от type родительского markup
 */
export default function MarkupConfig(validationOptions?: ValidationOptions) {
    return (object: Object, propertyName: string) => {
        registerDecorator({
            name: "markupConfig",
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: ["markupConfig"],
            validator: MarkupConfigConstraint
        });
    }
}
