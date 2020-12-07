export enum MarkupTypeEnum {
    // классификация изображений
    CLASSIFICATION = "classification",
    // поиск заданного объекта
    RECOGNITION = "recognition",
    // поиск нескольких заданных
    MULTI_RECOGNITION = "multi-recognition",
    // разметка объектов на изображении (границы + подпись)
    OBJECT_ANNOTATION = "object-annotation"
}

export enum UserRole {
    EXPERT = "expert",
    CUSTOMER = "customer",
    ADMIN = "admin"
}
