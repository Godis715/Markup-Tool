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
    onSubmit: (result: ClassificationItemResult) => void
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
            <Col md="auto">
                <img src={props.imageSrc} style={{ border: "1px solid lightgray" }} />
            </Col>
            <Col className="pl-0">
                <Card.Title>На изображении находится:</Card.Title>
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
    </Container>;
}
