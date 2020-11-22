import React, { ReactElement, useEffect, useReducer, useRef } from "react";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import { MultiRecognitionItemResult } from "../../../types/markupItem";
import RectFrame from "../RectFrame/RectFrame";
import "./style.scss";

type Props = {
    imageSrc: string,
    onSubmit: (result: MultiRecognitionItemResult) => void,
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
    drawingRect: Rect | null,
    rects: Rect[]
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
    type: "RESET_DRAWING"
} | {
    type: "RESET_STATE"
} | {
    type: "REMOVE_RECT",
    index: number
}

function reducer(state: State, action: Action): State {
    switch(action.type) {
        case "START_DRAWING": {
            return {
                ...state,
                drawingRect: action.rect
            };
        }
        case "DRAW_RECT": {
            return {
                ...state,
                drawingRect: action.rect
            };
        }
        case "FINISH_DRAWING": {
            if (!state.drawingRect) {
                return state;
            }

            return {
                ...state,
                rects: state.rects.concat(state.drawingRect),
                drawingRect: null
            };
        }
        case "RESET_DRAWING": {
            return {
                ...state,
                drawingRect: null
            };
        }
        case "REMOVE_RECT": {
            return {
                ...state,
                rects: [
                    ...state.rects.slice(0, action.index),
                    ...state.rects.slice(action.index + 1)
                ]
            };
        }
        case "RESET_STATE": {
            return {
                drawingRect: null,
                rects: []
            };
        }
        default: {
            return state;
        }
    }
}

/* function squareDistToRectBorder(rect: Rect, point: { x: number, y: number }): number {
    let dist = Infinity;
    if (rect.y1 <= point.y && point.y <= rect.y2) {
        dist = Math.min((rect.x1 - point.x) ** 2, (rect.x2 - point.x) ** 2);
    }

    if (rect.x1 <= point.x && point.x <= rect.x2) {
        dist = Math.min(dist, (rect.y1 - point.y) ** 2, (rect.y2 - point.y) ** 2);
    }

    [[rect.x1, rect.y1], [rect.x1, rect.y2], [rect.x2, rect.y1], [rect.x2, rect.y2]].forEach(
        ([x, y]) => {
            dist = Math.min(dist, (x - point.x) ** 2 + (y - point.y) ** 2);
        }
    )

    return dist;
} */

export default function MultiRecognitionTool(props: Props): ReactElement {
    const [{ rects, drawingRect }, dispatch] = useReducer(reducer, {
        drawingRect: null,
        rects: []
    });

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
        if (drawingRect && drawingRect.x1 !== drawingRect.x2 && drawingRect.y1 !== drawingRect.y2) {
            dispatch({ type: "FINISH_DRAWING" });
        }
        else {
            dispatch({ type: "RESET_DRAWING" });
        }
    };

    const onMouseMove = (ev: Event) => {
        if (!drawingRect || !workspaceRef.current) {
            return;
        }

        const elemRect = workspaceRef.current.getBoundingClientRect();
        const mouseEv = ev as MouseEvent;

        const x = Math.max(0, Math.min(mouseEv.clientX - elemRect.left, elemRect.width));
        const y = Math.max(0, Math.min(mouseEv.clientY - elemRect.top, elemRect.height));

        dispatch({
            type: "DRAW_RECT",
            rect: {
                ...drawingRect,
                x2: x,
                y2: y
            }
        });
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
        props.onSubmit({
            status: "SUCCESS",
            rectangles: rects
        });
        dispatch({ type: "RESET_STATE" });
    };

    const onCannotFindClick = () => {
        props.onSubmit({ status: "CANNOT_DETECT_OBJECT" });
    };

    return <div className="multi-recognition-tool">
        <Card.Text>{props.description}</Card.Text>
        <Card.Text>Выделите &quot;{props.objectToFind}&quot;</Card.Text>
        <div
            ref={workspaceRef}
            className="multi-recognition-tool__workspace overlay"
            onMouseDown={onMouseDown}
        >
            <img src={props.imageSrc} />
            {
                drawingRect &&
                <RectFrame
                    rect={drawingRect}
                    className="overlay__layer"
                />
            }
            {
                rects.map(
                    (r, i) => <RectFrame
                        rect={r}
                        className="overlay__layer"
                        onClose={() => {
                            dispatch({
                                type: "REMOVE_RECT",
                                index: i
                            });
                        }}
                    />
                )
            }
            {/*
                !isDrawing && rect &&
                <RectFrameOuterFilter
                    left={left}
                    top={top}
                    width={width}
                    height={height}
                    filter={"blur(10px)"}
                    className="overlay__layer"
                />
            */}
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
                Объекты отсутствуют
            </Button>
        </div>
    </div>;
}

