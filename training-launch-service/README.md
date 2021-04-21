## Очереди и типы сообщений

- Exchange `markup_item.created`

    Тип сообщений:
    ```typescript
    {
        type: "classification" | "recognition" | "multi-recognition"
        markupId: string,
        expertId: string,
        markupItemId: string,
    }
    ```

- Queue `markup_item.get_all`

    Сервис отправляет сообщение типа:
    ```typescript
    {
        markupId: string
    }
    ```
    В ответ принимает сообщения типа:
    ```typescript
    {
        markupId: string,
        type: "classification" | "recognition" | "multi-recognition",
        items: {
            id: string,
            result: unknown,
            datasetItemId: string,
            imageUrl: string
        }[]
    }
    ```

- Queue `result_inference`

    Сервис отправляет сообщение типа:
    ```typescript
    {
        markupId: string,
        type: "classification" | "recognition" | "multi-recognition",
        items: {
            id: string,
            result: unknown,
            datasetItemId: string,
            imageUrl: string
        }[]
    }
    ```
    В ответ принимает сообщения типа:
    ```typescript
    {
        markupId: string,
        type: MarkupType,
        items: {
            id: string,
            result: unknown,
            datasetItemId: string,
            imageUrl: string
        }[]
    }
    ```
    (В данном случае в `items` все `datasetItemId` уникальные)

- Queue `model.training.start`

    Сервис отправляет сообщение типа:
    ```typescript
    {
        modelId: string,
        markupId: string,
        type: "classification" | "recognition" | "multi-recognition"
    }
    ```

