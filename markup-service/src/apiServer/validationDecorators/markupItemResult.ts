import {
    registerDecorator,
    ValidationOptions,
    ValidationArguments,
    ValidatorConstraint,
    ValidatorConstraintInterface
} from 'class-validator';
import Ajv from "ajv";
import { MarkupItem } from '../../entity/MarkupItem';
import { MarkupTypeEnum } from '../../types/markup';

const coordSchema = {
    type: "number",
    minimum: 0
};

// JSON-схемы для результатов разметки различных типов
const schemas: { [T in MarkupTypeEnum]: object } = {
    /**
     * TODO:
     * можно сделать параметризованную схему -
     * проверять, что строка - один из возможных вариантов
     */
    [MarkupTypeEnum.CLASSIFICATION]: {
        type: "string"
    },
    /**
     * а здесь - условие на координаты и что координаты не превосходят
     * размера картинки
     */
    [MarkupTypeEnum.RECOGNITION]: {
        properties: {
            status: {
                type: "string",
                enum: ["SUCCESS", "CANNOT_DETECT_OBJECT"]
            },
            rectangle: {
                type: "object",
                required: ["x1", "y1", "x2", "y2"],
                properties: {
                    x1: coordSchema,
                    y1: coordSchema,
                    x2: coordSchema,
                    y2: coordSchema
                },
                additionalProperties: false
            }
        },
        additionalProperties: false
    },

    [MarkupTypeEnum.MULTI_RECOGNITION]: {
        // FIX ME: добавить две ситуации: когда объект найден и когда нет
        //required: ["status", "rectangles"],
        properties: {
            status: {
                type: "string",
                enum: ["SUCCESS", "CANNOT_DETECT_OBJECT"]
            },
            rectangles: {
                type: "array",
                minItems: 1,
                items: {
                    type: "object",
                    required: ["x1", "y1", "x2", "y2"],
                    properties: {
                        x1: coordSchema,
                        y1: coordSchema,
                        x2: coordSchema,
                        y2: coordSchema
                    },
                    additionalProperties: false
                }
            }
        },
        additionalProperties: false
    }
};

@ValidatorConstraint({ name: "markupItemResult", async: false })
export class MarkupItemResultConstraint implements ValidatorConstraintInterface {
    public message: string | null = null;

    public validate(value: any, args: ValidationArguments) {
        const markup = (args.object as MarkupItem).markup;

        if (!markup) {
            return false;
        }

        const schema = schemas[markup.type as MarkupTypeEnum];
        const ajv = new Ajv({ allErrors: true });
        const isValid = ajv.validate(schema, value);

        if (!isValid) {
            this.message = ajv.errorsText();
            console.error(this.message);
            return false;
        }

        return true;
    }

    public defaultMessage() {
      return `Markup item's result has wrong format: ${this.message}`;
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
