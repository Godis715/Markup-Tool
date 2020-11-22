import React, { ReactElement, useEffect, useRef } from "react";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import { MultiRecognitionItemResult } from "../../../types/markupItem";
import "./style.scss";
import { useState } from "react";

type Props = {
    imageSrc: string,
    onSubmit: (result: MultiRecognitionItemResult) => void,
    objectToFind: string,
    description: string
};

export default function BitmapMaskTool(props: Props): ReactElement {
    const [isMouseDown, setIsMouseDown] = useState(false);
    const [imgSize, setImgSize] = useState<{ width: number, height: number }|null>(null);

    const workspaceRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const onMouseDown = (ev: React.MouseEvent<HTMLDivElement>) => {
        const ctx = canvasRef.current?.getContext("2d");

        if (!workspaceRef.current || !ctx) {
            return;
        }

        const elemRect = workspaceRef.current.getBoundingClientRect();
        const localX = ev.clientX - elemRect.left;
        const localY = ev.clientY - elemRect.top;

        ctx.beginPath();
        ctx.moveTo(localX, localY);
        ctx.lineTo(localX, localY);
        ctx.strokeStyle = "rgb(30, 30, 30)";
        ctx.lineWidth = 10;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.stroke();

        setIsMouseDown(true);
    };

    const onMouseMove = (ev: Event) => {
        if (!isMouseDown || !workspaceRef.current || !canvasRef.current) {
            return;
        }

        // вынес инициализацию контекста сюда, чтобы не создавать его каждый раз при заходе в эту функцию
        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) {
            return;
        }

        const elemRect = workspaceRef.current.getBoundingClientRect();
        const mouseEv = ev as MouseEvent;

        const localX = mouseEv.clientX - elemRect.left;
        const localY = mouseEv.clientY - elemRect.top;

        ctx.lineTo(localX, localY);
        ctx.strokeStyle = "rgb(30, 30, 30)";
        ctx.lineWidth = 10;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.stroke();
    };

    const onMouseUp = () => {
        setIsMouseDown(false);
    };

    const onImageLoad = (ev: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = ev.target as HTMLImageElement;
        setImgSize({ width, height });
    };

    useEffect(() => {
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);

        return () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        };
    }, [onMouseMove, onMouseUp]);

    /* const onSubmitClick = () => {
        props.onSubmit({
            status: "SUCCESS",
            rectangles: rects
        });
        dispatch({ type: "RESET_STATE" });
    };

    const onCannotFindClick = () => {
        props.onSubmit({ status: "CANNOT_DETECT_OBJECT" });
    };
    */

    return <div className="bitmap-mask-tool">
        <Card.Text>{props.description}</Card.Text>
        <Card.Text>Выделите &quot;{props.objectToFind}&quot;</Card.Text>
        <div
            ref={workspaceRef}
            className="overlay markup-image-container"
            onMouseDown={onMouseDown}
        >
            <img
                src="https://www.ejin.ru/wp-content/uploads/2017/09/1-942.jpg"
                onLoad={onImageLoad}
            />
            <canvas
                className="overlay__layer"
                ref={canvasRef}
                width={imgSize?.width}
                height={imgSize?.height}
            />
        </div>
        <div className="mt-2">
            {/*<Button
                onClick={onSubmitClick}
            >
                Отправить
            </Button>
            <Button
                className="ml-1"
                variant="outline-danger"
                onClick={onCannotFindClick}
            >
                Объекты отсутствуют
            </Button>*/}
        </div>
    </div>;
}

