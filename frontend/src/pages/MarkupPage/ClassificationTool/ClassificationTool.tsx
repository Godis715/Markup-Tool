import React from "react";
import Button from "react-bootstrap/Button";
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
                <Card.Text>Изображение относится к классу:</Card.Text>
                {
                    props.classes.map(
                        (className) => <Button
                            key={className}
                            onClick={() => onClassNameClick(className)}
                            variant="light"
                            className="mr-2 mb-2"
                        >
                            {className}
                        </Button>
                    )
                }
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
