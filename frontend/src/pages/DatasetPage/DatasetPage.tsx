import React, { useEffect, useReducer, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchDataset, postMarkup } from "../../remote/api";
import { DatasetDetailed } from "../../types/dataset";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Table from "react-bootstrap/Table";
import Badge from "react-bootstrap/Badge";
import { LinkContainer } from "react-router-bootstrap";
import Breadcrumb from "react-bootstrap/Breadcrumb";
import CreateMarkupModal from "./CreateMarkupModal";
import { MarkupConfig, MarkupType } from "../../types/markup";
import { MARKUP_TYPE_LITERALS } from "../../constants/literals";
import "./style.scss";
import Divider from "../../components/Divider/Divider";

enum ActionType {
    RECIEVE_DATASET
}

type Action = {
    type: ActionType.RECIEVE_DATASET,
    dataset: DatasetDetailed
}

type State = {
    // null, когда датасет не был загружен
    dataset: DatasetDetailed | null,
    recievingDataset: boolean
};

function reducer(state: State, action: Action): State {
    switch(action.type) {
        case ActionType.RECIEVE_DATASET:
            return {
                ...state,
                dataset: action.dataset,
                recievingDataset: false
            } as State;
        default:
            return state;
    }
}

type QueryParams = {
    datasetId: string
};

export default function DatasetPage(): JSX.Element {
    const { datasetId } = useParams<QueryParams>();
    // в начальном состоянии стоит флаг о том, что данные загружаются с сервера
    const [state, dispatch] = useReducer(reducer, {
        dataset: null,
        recievingDataset: true
    });

    const [showModal, setShowModal] = useState(false);

    const openModal = () => setShowModal(true);
    const closeModal = () => setShowModal(false);

    // получение датасетов с сервера единожды при загрузке страницы
    useEffect(() => {
        const effect = async () => {
            const result = await fetchDataset(datasetId);

            if (!result.isSuccess) {
                console.error(result.error.original);
                return;
            }

            dispatch({
                type: ActionType.RECIEVE_DATASET,
                dataset: result.data
            });
        };

        effect();
    }, []);

    const onSubmitMarkup = (type: MarkupType, description: string, config: MarkupConfig) => {
        postMarkup(datasetId, type, description, config).then(closeModal);
    };

    return <>
        <CreateMarkupModal
            show={showModal}
            onHide={closeModal}
            onSubmit={onSubmitMarkup}
        />
        {
            <Container className="px-0">
                <Breadcrumb>
                    <Breadcrumb.Item>
                        <Link to="/">Главная</Link>
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>
                        <Link to="/dataset">Датасеты</Link>
                    </Breadcrumb.Item>
                    <Breadcrumb.Item active>
                        {state.dataset?.name}
                    </Breadcrumb.Item>
                </Breadcrumb>

                <Row className="mt-4">
                    <Col as="h2">{state.dataset?.name}</Col>
                </Row>

                <Row>
                    <Col as="small" className="text-muted">
                        Дата загрузки: {state.dataset?.uploadDate.toLocaleDateString("ru")}
                    </Col>
                </Row>

                <Row className="mt-4">
                    <Col as="h5">Разметка</Col>
                    <Col className="d-flex justify-content-end">
                        <Button variant="outline-primary" onClick={openModal}>Добавить разметку</Button>
                    </Col>
                </Row>

                <Divider />

                <Row className="mt-2">
                    <Col>
                        <Table hover>
                            <thead>
                                <tr>
                                    <th>№</th>
                                    <th>Тип</th>
                                    <th>Дата создания</th>
                                    <th>Статус</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    state.dataset?.markups.length === 0 &&
                                    <tr>
                                        <td align="center" colSpan={4}>Разметка датасета отсутствует</td>
                                    </tr>
                                }
                                {
                                    state.dataset?.markups?.map(
                                        (markup, i) => <LinkContainer
                                            to={`/dataset/${datasetId}/markup/${markup.id}`}
                                            key={markup.id}
                                        >
                                            <tr>
                                                <td>{i + 1}</td>
                                                <td>{MARKUP_TYPE_LITERALS[markup.type]} </td>
                                                <td>{markup.createDate.toLocaleDateString("ru")}</td>
                                                <td>
                                                    {/** <Badge variant="success">Завершен</Badge> */}
                                                    <Badge variant="primary">В процессе</Badge>
                                                </td>
                                            </tr>
                                        </LinkContainer>
                                    )
                                }
                            </tbody>
                        </Table>
                    </Col>
                </Row>
            </Container>
        }
    </>;
}
