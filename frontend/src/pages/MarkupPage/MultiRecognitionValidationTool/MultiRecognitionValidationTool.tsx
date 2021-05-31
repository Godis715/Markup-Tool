import React, { useEffect, useReducer } from "react";
import Button from "react-bootstrap/Button";
import { MultiRecognitionValidationResult } from "../../../types/markupItem";
import { cn } from "@bem-react/classname";
import RectFrame from "../RectFrame/RectFrame";
import Alert from "react-bootstrap/Alert";
import Form from "react-bootstrap/Form";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import "./style.scss";

type Props = {
    imageSrc: string,
    objectToFind: string,
    description: string,
    rects: Rect[],
    onSubmit: (result: MultiRecognitionValidationResult) => void,
};

type Rect = {
    x1: number,
    y1: number,
    x2: number,
    y2: number
}

type ImageSize = {
    width: number,
    height: number
};

type State = {
    imgOrigSize: ImageSize | undefined,
    scaleIndex: number
}

type Action = {
    type: "RESET_STATE"
} | {
    type: "INCREASE_SCALE"
} | {
    type: "DECREASE_SCALE"
} | {
    type: "SET_IMAGE_ORIG_SIZE",
    imgOrigSize: ImageSize
};

function reducer(state: State, action: Action): State {
    switch(action.type) {
        case "RESET_STATE": {
            return {
                ...state,
                imgOrigSize: undefined
            };
        }
        case "INCREASE_SCALE": {
            return {
                ...state,
                scaleIndex: state.scaleIndex + (state.scaleIndex < scales.length - 1
                    ? 1
                    : 0
                )
            };
        }
        case "DECREASE_SCALE": {
            return {
                ...state,
                scaleIndex: state.scaleIndex - (state.scaleIndex > 0
                    ? 1
                    : 0
                )
            };
        }
        case "SET_IMAGE_ORIG_SIZE": {
            return {
                ...state,
                imgOrigSize: action.imgOrigSize
            };
        }
        default: {
            return state;
        }
    }
}

const colors = [
    "#05b8ff",
    "#ffd105",
    "#ff055d",
    "#8aff05",
    "#ffbc05",
    "#f705ff"
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

const cnTool = cn("MultiRecognitionValidationTool");

export default function MultiRecognitionValidationTool(props: Props): JSX.Element {
    const {
        imageSrc,
        onSubmit,
        objectToFind,
        rects,
        description
    } = props;

    const [state, dispatch] = useReducer(reducer, {
        imgOrigSize: undefined,
        scaleIndex: 3
    });

    const { scaleIndex, imgOrigSize } = state;

    const imgScale = scales[scaleIndex];
    const imgStyle = imgOrigSize && {
        height: imgOrigSize.height * imgScale,
        width: "auto"
    };

    const handleCorrectClick = (): void => {
        onSubmit({ isCorrect: true });
        dispatch({ type: "RESET_STATE" });
    };

    const handleNotCorrectClick = (): void => {
        onSubmit({ isCorrect: false });
        dispatch({ type: "RESET_STATE" });
    };

    const handleImageLoaded = (ev: React.SyntheticEvent<HTMLImageElement>): void => {
        const {
            naturalWidth: width,
            naturalHeight: height
        } = ev.target as HTMLImageElement;

        dispatch({
            type: "SET_IMAGE_ORIG_SIZE",
            imgOrigSize: { width, height }
        });
    };

    const increaseScale = (): void => dispatch({ type: "INCREASE_SCALE" });

    const decreaseScale = (): void => dispatch({ type: "DECREASE_SCALE" });

    return (
        <div className={cnTool()}>
            <Alert variant="secondary">
                Верно ли выделены &quot;{objectToFind}&quot;?
            </Alert>
            <div className="workspace mt-2">
                <div className={cnTool("Workspace", ["overlay", "markup-image-container"])}>
                    <img
                        src={imageSrc}
                        style={imgStyle}
                        onLoad={handleImageLoaded}
                    />
                    {imgOrigSize && rects.map(
                        (r, i) => <RectFrame
                            key={JSON.stringify(r)}
                            rect={r}
                            className="overlay__layer"
                            color={colors[i % colors.length]}
                            scale={imgScale}
                        />
                    )}
                </div>
            </div>
            <div className="mt-2 d-flex justify-content-between">
                <Form className="ml-3">
                    <Form.Group className="mb-0">
                        <Form.Label>Масштаб</Form.Label>
                        <ButtonGroup className="ml-1">
                            <Button variant="outline-primary" onClick={increaseScale}>+</Button>
                            <Button variant="outline-primary" onClick={decreaseScale}>-</Button>
                        </ButtonGroup>
                    </Form.Group>
                </Form>
                <div className="flex-grow-1" />
                <Button
                    onClick={handleCorrectClick}
                    className="ml-1"
                >
                    Верно
                </Button>
                <Button
                    onClick={handleNotCorrectClick}
                    variant="danger"
                    className="ml-1"
                >
                    Неверно
                </Button>
            </div>
        </div>
    );
}
