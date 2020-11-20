import React, { ReactElement, useEffect, useReducer, useRef } from "react";
import { RecognitionItemResult } from "../../../types/markupItem";
import Button from "react-bootstrap/Button";
import "./style.scss";
import Card from "react-bootstrap/Card";
import RectFrame from "../RectFrame/RectFrame";
import RectFrameOuterFilter from "../RectFrameOuterFilter/RectFrameOuterFilter";

type Props = {
    imageSrc: string,
    onSubmit: (result: RecognitionItemResult) => void,
    objectToFind: string,
    description: string
};

type Rect = {
    x1: number,
    y1: number,
    x2: number,
    y2: number
}

type State = {
    rect: Rect | null,
    isDrawing: boolean
}

type Action = {
    type: "START_DRAWING",
    rect: Rect
} | {
    type: "DRAW_RECT",
    rect: Rect
} | {
    type: "FINISH_DRAWING"
} | {
    type: "RESET_STATE"
}

function reducer(state: State, action: Action) {
    switch(action.type) {
        case "START_DRAWING": {
            return {
                ...state,
                rect: action.rect,
                isDrawing: true
            };
        }
        case "DRAW_RECT": {
            return {
                ...state,
                rect: action.rect
            };
        }
        case "FINISH_DRAWING": {
            return {
                ...state,
                isDrawing: false
            };
        }
        case "RESET_STATE": {
            return {
                rect: null,
                isDrawing: false
            };
        }
        default: {
            return state;
        }
    }
}

export default function RecognitionTool(props: Props): ReactElement {
    const [state, dispatch] = useReducer(reducer, {
        rect: null,
        isDrawing: false
    });

    const { rect, isDrawing } = state;

    const workspaceRef = useRef<HTMLDivElement>(null);

    const onMouseDown = (ev: React.MouseEvent<HTMLDivElement>) => {
        if (!workspaceRef.current) {
            return;
        }

        const elemRect = workspaceRef.current.getBoundingClientRect();
        const localX = ev.clientX - elemRect.left;
        const localY = ev.clientY - elemRect.top;

        dispatch({
            type: "START_DRAWING",
            rect: {
                x1: localX,
                y1: localY,
                x2: localX,
                y2: localY
            }
        });
    };

    const onMouseUp = () => {
        if (rect && rect.x1 !== rect.x2 && rect.y1 !== rect.y2) {
            dispatch({ type: "FINISH_DRAWING" });
        }
        else {
            dispatch({ type: "RESET_STATE" });
        }
    };

    const onMouseMove = (ev: Event) => {
        if (!isDrawing || !rect || !workspaceRef.current) {
            return;
        }

        const elemRect = workspaceRef.current.getBoundingClientRect();
        const mouseEv = ev as MouseEvent;

        const x = Math.max(0, Math.min(mouseEv.clientX - elemRect.left, elemRect.width));
        const y = Math.max(0, Math.min(mouseEv.clientY - elemRect.top, elemRect.height));

        dispatch({
            type: "DRAW_RECT",
            rect: {
                ...rect,
                x2: x,
                y2: y
            }
        });
    };

    const onRemoveRect = () => {
        dispatch({ type: "RESET_STATE" });
    };

    useEffect(() => {
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);

        return () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };
    }, [onMouseMove, onMouseUp]);

    const onSubmitClick = () => {
        if (!rect) {
            return;
        }

        props.onSubmit({
            status: "SUCCESS",
            rectangle: rect
        });
        dispatch({ type: "RESET_STATE" });
    };

    const onCannotFindClick = () => {
        props.onSubmit({ status: "CANNOT_DETECT_OBJECT" });
    };

    return <div className="recognition-tool">
        <Card.Text>{props.description}</Card.Text>
        <Card.Text>Выделите &quot;{props.objectToFind}&quot;</Card.Text>
        <div
            ref={workspaceRef}
            className="recognition-tool__workspace overlay"
            onMouseDown={onMouseDown}
        >
            <img src={props.imageSrc} />
            {
                rect &&
                <RectFrame
                    rect={rect}
                    className="overlay__layer"
                    onClose={!isDrawing ? onRemoveRect : undefined}
                />
            }
            {
                !isDrawing && rect &&
                <RectFrameOuterFilter
                    rect={rect}
                    filter={"invert(30%)"}
                    className="overlay__layer"
                />
            }
        </div>
        <div className="mt-2">
            <Button
                onClick={onSubmitClick}
            >
                Отправить
            </Button>
            <Button
                className="ml-1"
                variant="outline-danger"
                onClick={onCannotFindClick}
            >
                Объект отсутствует
            </Button>
        </div>
    </div>;
}
