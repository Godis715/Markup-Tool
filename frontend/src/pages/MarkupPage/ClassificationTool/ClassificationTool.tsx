import React from "react";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import { ClassificationItemResult } from "../../../types/markupItem";

type Props = {
    classes: string[],
    imageSrc: string,
    onSubmit: (result: ClassificationItemResult) => void,
    description: string
};

/**
 * Компонент для отрисовки интерфейса для классификации картинкок,
 * в который входит список классов и само изображение
 */
export default function ClassificationTool(props: Props): JSX.Element {
    const onClassNameClick = (className: string) => {
        props.onSubmit(className);
    };

    return <Container className="pl-0">
        <Row>
            <Col>
                <Card.Text>{props.description}</Card.Text>
                <Card.Text>Выберите один из предложенных вариантов:</Card.Text>
                <ButtonGroup className="mb-2">
                    {
                        props.classes.map(
                            (className) => <Button
                                key={className}
                                onClick={() => {
                                    onClassNameClick(className);
                                }}
                                variant="outline-primary"
                                active={false}
                            >
                                {className}
                            </Button>
                        )
                    }
                </ButtonGroup>

            </Col>
        </Row>
        <Row>
            <Col md="auto">
                <div className="markup-image-container">
                    <img src={props.imageSrc} className="markup-image" />
                </div>
            </Col>
        </Row>
    </Container>;
}
