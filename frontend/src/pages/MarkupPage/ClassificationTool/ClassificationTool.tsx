import React from "react";

type ClassificationResult = string;

type Props = {
    classes: string[],
    imageSrc: string,
    onSubmit: (result: ClassificationResult) => void
};

/**
 * Компонент для отрисовки интерфейса для классификации картинкок,
 * в который входит список классов и само изображение
 */
export default function ClassificationTool(props: Props): JSX.Element {
    const onClassNameClick = (className: string) => {
        props.onSubmit(className);
    };

    return <div>
        <div>На изображении находится:</div>
        <div>{
            props.classes.map(
                (className) => <button
                    key={className}
                    onClick={() => onClassNameClick(className)}>
                    {className}
                </button>
            )
        }</div>
        <img src={props.imageSrc} alt="Изображение для классификации" />
    </div>;
}
