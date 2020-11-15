import {
    registerDecorator,
    ValidationOptions,
    ValidationArguments
} from 'class-validator';
/**
 * Декоратор для проверки того, что целевое свойство - это массив уникальных объектов по значению
 * некоторого параметра, например, id
 * То есть массив уникальных объектов, где сравнение производится по значению заданной свойства
 */
export default function ArrayUniqueByProp(uniqueProp: string, validationOptions?: ValidationOptions) {
    return (object: Object, propertyName: string) => {
        registerDecorator({
            name: "arrayUniqueByProp",
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: ["arrayUniqueByProp"],
            validator: {
                validate(valueArr: any[], args: ValidationArguments) {
                    // TODO: можно переписать с использованием map, Set и Set.size
                    const unqiuePropValues = new Set();
                    for(const value of valueArr) {
                        const propValue = value[uniqueProp];
                        if(unqiuePropValues.has(propValue)) {
                            return false;
                        }

                        unqiuePropValues.add(propValue);
                    }

                    return true;
                },
                
                defaultMessage: () => `'${propertyName}' must be array of objects unique by '${uniqueProp}'`
            }
        });
    }
}
