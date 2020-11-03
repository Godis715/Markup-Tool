import React, { ReactElement, useRef, useState } from "react";
import { RecognitionItemResult } from "../../../types/markupItem";
import Button from "react-bootstrap/Button";
import "./style.scss";
import Card from "react-bootstrap/Card";

type Props = {
    imageSrc: string,
    onSubmit: (result: RecognitionItemResult) => void
};

type Rect = {
    x1: number,
    y1: number,
    x2: number,
    y2: number
}

export default function RecognitionTool(props: Props): ReactElement {
    const [isMouseDown, setIsMouseDown] = useState(false);
    const [rect, setRect] = useState<Rect|null>(null);
    const rectSelectRef = useRef<HTMLDivElement>(null);

    const onMouseDown = (ev: React.MouseEvent) => {
        if (!rectSelectRef.current) {
            return;
        }

        const elemRect = rectSelectRef.current.getBoundingClientRect();
        const localX = ev.clientX - elemRect.left;
        const localY = ev.clientY - elemRect.top;

        setRect({
            x1: localX,
            y1: localY,
            x2: localX,
            y2: localY
        });

        setIsMouseDown(true);
    };

    const onFinishRectDraw = () => {
        setIsMouseDown(false);
        // если прямоугольник вырожденный
        if (rect && (rect.x1 === rect.x2 || rect.y1 === rect.y2)) {
            setRect(null);
        }
    };

    const onMouseMove = (ev: React.MouseEvent) => {
        if (!isMouseDown || !rect || !rectSelectRef.current) {
            return;
        }

        const elemRect = rectSelectRef.current.getBoundingClientRect();

        setRect({
            ...rect,
            x2: ev.clientX - elemRect.left,
            y2: ev.clientY - elemRect.top
        });
    };

    const onSubmitClick = () => {
        if (!rect) {
            return;
        }

        props.onSubmit(rect);
        setRect(null);
        setIsMouseDown(false);
    };

    return <div className="recognition-tool">
        <Card.Title>Выделите что-то</Card.Title>
        <div className="overlaying">
            {/** TODO: Добавить image.onError */}
            <img
                className="overlaying__back"
                src={props.imageSrc}
            />
            <div className="overlaying__front">
                <div
                    className="rect-select"
                    onMouseDown={onMouseDown}
                    onMouseUp={onFinishRectDraw}
                    onMouseMove={onMouseMove}
                    ref={rectSelectRef}
                >
                    {
                        rect &&
                        <div
                            className="rect-select__rect"
                            style={{
                                left: `${Math.min(rect.x1, rect.x2)}px`,
                                top: `${Math.min(rect.y1, rect.y2)}px`,
                                width: `${Math.abs(rect.x1 - rect.x2)}px`,
                                height: `${Math.abs(rect.y1 - rect.y2)}px`
                            }}
                        />
                    }
                </div>
            </div>
        </div>
        <Button
            onClick={onSubmitClick}
            disabled={!rect}
            className="mt-2"
        >
            Отправить
        </Button>
    </div>;
}
