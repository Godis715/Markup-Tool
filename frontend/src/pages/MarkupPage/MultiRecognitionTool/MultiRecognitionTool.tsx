import React from "react";
import Button from "react-bootstrap/Button";
import { MultiRecognitionItemResult } from "../../../types/markupItem";
import RectFrame from "../RectFrame/RectFrame";
import "./style.scss";
import Alert from "react-bootstrap/Alert";
import Form from "react-bootstrap/Form";
import ButtonGroup from "react-bootstrap/ButtonGroup";

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

type ClassState = {
    drawingRect: Rect | null,
    rects: Rect[],
    imgOrigSize: {
        width: number,
        height: number
    } | undefined,
    scaleIndex: number
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
        case "START_DRAWING":
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

const colors = [
    "#05b8ff",
    "#ffd105",
    "#ff055d",
    "#ffbc05",
    "#f705ff",
    "#8aff05"
];

const scales = [
    0.25,
    0.5,
    0.75,
    1.0,
    1.5,
    2.5,
    4
];

export default class MultiRecognitionTool extends React.PureComponent<Props, ClassState> {
    public state: ClassState;
    public workspaceRef: React.RefObject<HTMLDivElement>;

    constructor(props: Props) {
        super(props);

        this.state = {
            drawingRect: null,
            rects: [],
            imgOrigSize: undefined,
            scaleIndex: 3
        };

        this.workspaceRef = React.createRef<HTMLDivElement>();
    }

    componentDidMount(): void {
        document.addEventListener("mouseup", this.onMouseUp);
        document.addEventListener("mousemove", this.onMouseMove);
    }

    componentWillUnmount(): void {
        document.removeEventListener("mouseup", this.onMouseUp);
        document.removeEventListener("mousemove", this.onMouseMove);
    }

    dispatch = (action: Action): void => {
        this.setState(
            reducer(this.state, action)
        );
    }

    onMouseDown = (ev: React.MouseEvent<HTMLDivElement>) => {
        if (!this.workspaceRef.current) {
            return;
        }

        const imgScale = scales[this.state.scaleIndex];

        const elemRect = this.workspaceRef.current.getBoundingClientRect();
        const localX = ev.clientX - elemRect.left;
        const localY = ev.clientY - elemRect.top;

        this.dispatch({
            type: "START_DRAWING",
            rect: {
                x1: localX / imgScale,
                y1: localY / imgScale,
                x2: localX / imgScale,
                y2: localY / imgScale
            }
        });
    };

    onMouseUp = (ev: Event) => {
        const { drawingRect } = this.state;

        if (drawingRect && drawingRect.x1 !== drawingRect.x2 && drawingRect.y1 !== drawingRect.y2) {
            this.dispatch({ type: "FINISH_DRAWING" });
        }
        else {
            this.dispatch({ type: "RESET_DRAWING" });
        }
    };

    onMouseMove = (ev: Event) => {
        const { drawingRect } = this.state;

        if (!drawingRect || !this.workspaceRef.current) {
            return;
        }

        const elemRect = this.workspaceRef.current.getBoundingClientRect();
        const mouseEv = ev as MouseEvent;

        const imgScale = scales[this.state.scaleIndex];
        const x = Math.max(0, Math.min(mouseEv.clientX - elemRect.left, elemRect.width)) / imgScale;
        const y = Math.max(0, Math.min(mouseEv.clientY - elemRect.top, elemRect.height)) / imgScale;

        this.dispatch({
            type: "DRAW_RECT",
            rect: {
                ...drawingRect,
                x2: x,
                y2: y
            }
        });
    };

    onSubmitClick = () => {
        this.props.onSubmit({
            status: "SUCCESS",
            rectangles: this.state.rects
        });
        this.dispatch({ type: "RESET_STATE" });
    };

    onResetClick = () => {
        this.dispatch({ type: "RESET_STATE" });
    };

    onCannotFindClick = () => {
        this.props.onSubmit({ status: "CANNOT_DETECT_OBJECT" });
    };

    onImageLoad = (ev: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = ev.target as HTMLImageElement;
        this.setState({
            imgOrigSize: { width, height }
        });
    };

    increaseScale = () => {
        if (this.state.scaleIndex < scales.length - 1) {
            this.setState({
                scaleIndex: this.state.scaleIndex + 1
            });
        }
    };

    decreaseScale = () => {
        if (this.state.scaleIndex > 0) {
            this.setState({
                scaleIndex: this.state.scaleIndex - 1
            });
        }
    };

    render(): JSX.Element {
        const { drawingRect, rects, scaleIndex, imgOrigSize } = this.state;
        const imgScale = scales[scaleIndex];
        const imgStyle = imgOrigSize && {
            height: imgOrigSize.height * imgScale,
            width: "auto"
        };

        return <div className="multi-recognition-tool">
            <Alert variant="secondary">Выделите &quot;{this.props.objectToFind}&quot;</Alert>
            <div className="workspace mt-2">
                <div
                    ref={this.workspaceRef}
                    className="multi-recognition-tool__workspace overlay markup-image-container"
                    onMouseDown={this.onMouseDown}
                >
                    <img
                        src={this.props.imageSrc}
                        style={imgStyle}
                        onLoad={this.onImageLoad}
                    />
                    {
                        drawingRect &&
                        <RectFrame
                            rect={drawingRect}
                            className="overlay__layer"
                            color={colors[rects.length % colors.length]}
                            scale={imgScale}
                        />
                    }
                    {
                        rects.map(
                            (r, i) => <RectFrame
                                rect={r}
                                className="overlay__layer"
                                onClose={() => {
                                    this.dispatch({
                                        type: "REMOVE_RECT",
                                        index: i
                                    });
                                }}
                                color={colors[i % colors.length]}
                                scale={imgScale}
                            />
                        )
                    }
                </div>
            </div>
            <div className="mt-2 d-flex justify-content-between">
                <Button
                    variant="secondary"
                    disabled={rects.length === 0}
                    onClick={this.onResetClick}
                >
                    Сбросить
                </Button>
                <Form className="ml-3">
                    <Form.Group className="mb-0">
                        <Form.Label>Масштаб</Form.Label>
                        <ButtonGroup className="ml-1">
                            <Button variant="outline-primary" onClick={this.increaseScale}>+</Button>
                            <Button variant="outline-primary" onClick={this.decreaseScale}>-</Button>
                        </ButtonGroup>
                    </Form.Group>
                </Form>
                <div className="flex-grow-1"></div>
                <Button
                    variant="danger"
                    onClick={this.onCannotFindClick}
                    disabled={rects.length > 0}
                >
                    Объекты отсутствуют
                </Button>
                <Button
                    onClick={this.onSubmitClick}
                    disabled={rects.length === 0}
                    className="ml-1"
                >
                    Отправить
                </Button>
            </div>
        </div>;
    }
}
