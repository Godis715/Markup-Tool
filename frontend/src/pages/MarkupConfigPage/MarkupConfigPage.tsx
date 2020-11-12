import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Breadcrumb from "react-bootstrap/Breadcrumb";
import { MarkupForCustomer } from "../../types/markup";
import { addExpertsToMarkup, fetchDataset, fetchMarkup } from "../../remote/api";
import { DatasetDetailed } from "../../../../backend/src/types/dataset";
import ListGroup from "react-bootstrap/ListGroup";
import InputGroup from "react-bootstrap/InputGroup";
import ProgressBar from "react-bootstrap/ProgressBar";
import { Form } from "react-bootstrap";
import { MARKUP_TYPE_LITERALS } from "../../constants/literals";

type Props = {
    datasetId: string,
    markupId: string
};

export default function MarkupConfigPage(props: Props): JSX.Element {
    const [markup, setMarkup] = useState<MarkupForCustomer|null>(null);
    const [dataset, setDataset] = useState<DatasetDetailed|null>(null);
    const [expertLogin, setExpertLogin] = useState<string>("");

    useEffect(
        () => {
            const initMarkup = async () => {
                const result = await fetchMarkup(props.markupId);
                if (!result.isSuccess) {
                    console.error(result.error);
                    return;
                }

                setMarkup(result.data as MarkupForCustomer);
            };

            // TODO: имя датасета можно класть в markup
            const initDataset = async () => {
                const result = await fetchDataset(props.datasetId);
                if (!result.isSuccess) {
                    console.error(result.error);
                    return;
                }

                setDataset(result.data);
            };

            initMarkup();
            initDataset();
        },
        []
    );

    const onSubmitExpert = async (ev: React.FormEvent<HTMLFormElement>) => {
        if (!markup) {
            return;
        }

        ev.stopPropagation();
        ev.preventDefault();

        if (!expertLogin) {
            return;
        }

        const result = await addExpertsToMarkup(props.markupId, expertLogin);
        if (result.isSuccess) {
            setMarkup({
                ...markup,
                experts: markup.experts.concat(expertLogin)
            });
            setExpertLogin("");
        }
        else {
            // TODO: выводить ошибку на экран, проверка на 404
            console.error(result.error);
        }

    };

    const onExpertLoginChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
        setExpertLogin(ev.target.value);
    };

    if (!markup) {
        return <></>;
    }

    return <div>
        <Breadcrumb>
            <Breadcrumb.Item>
                <Link to="/">Главная</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
                <Link to="/dataset">Датасеты</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
                <Link to={`/dataset/${props.datasetId}`}>{dataset?.name}</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item active>
                {MARKUP_TYPE_LITERALS[markup.type]}
            </Breadcrumb.Item>
        </Breadcrumb>

        <h2 className="mt-4">Разметка</h2>

        <Container className="px-0">
            <Row className="text-muted">
                <Col as="small" md="auto">Тип: {MARKUP_TYPE_LITERALS[markup.type]}</Col>
                <Col as="small" md="auto">Дата создания: {markup.createDate.toLocaleDateString("ru")}</Col>
            </Row>

            <Row className="mt-3">
                <Col>
                    <h5>Описание</h5>
                    <p>{markup.description}</p>
                </Col>
            </Row>
        </Container>

        <h5>Прогресс</h5>
        <ProgressBar
            className="mt-2"
            now={
                markup.progress.all === 0
                    ? 0
                    : 100 * markup.progress.done / markup.progress.all
            }
            label={`${markup.progress.done}/${markup.progress.all}`}
        />

        <hr className="col-xs-12" />

        <Container className="px-0">
            <Row className="mt-3" noGutters>
                <Col md={6}>
                    <h5>Управление экспертами</h5>

                    <div className="mt-3">Все эксперты ({markup.experts.length})</div>
                    <ListGroup className="mt-2 overflow-auto" style={{ maxHeight: "400px" }}>
                        {
                            markup.experts.length === 0
                                ? <ListGroup.Item className="d-flex justify-content-center">
                                    Эксперты не назначены
                                </ListGroup.Item>
                                : markup.experts.map(
                                    (expert) => <ListGroup.Item key={expert}>{expert}</ListGroup.Item>
                                )
                        }
                    </ListGroup>
                </Col>
            </Row>

            <Row className="mt-3" noGutters>
                <Col as={Form} md={6} onSubmit={onSubmitExpert}>
                    <Form.Group>
                        <Form.Label>Добавить эксперта</Form.Label>
                        <InputGroup>
                            <Form.Control
                                type="text"
                                placeholder="Логин эксперта"
                                value={expertLogin}
                                onChange={onExpertLoginChange}
                            />
                            <InputGroup.Append>
                                <Button type="submit" disabled={expertLogin === ""}>Добавить</Button>
                            </InputGroup.Append>
                        </InputGroup>
                    </Form.Group>
                </Col>
            </Row>
        </Container>
    </div>;
}
