import React, { useEffect, useReducer } from "react";
import { Link } from "react-router-dom";
import Breadcrumb from "react-bootstrap/Breadcrumb";
import ListGroup from "react-bootstrap/ListGroup";
import Alert from "react-bootstrap/Alert";
import { fetchDatasets } from "../../remote/api";
import { DatasetShort } from "../../types/dataset";

enum ActionType {
    RECIEVE_DATASETS
}

type Action = {
    type: ActionType.RECIEVE_DATASETS,
    datasets: DatasetShort[]
}

type State = {
    datasets: DatasetShort[],
    recievingDatasets: boolean
};

function reducer(state: State, action: Action): State {
    switch(action.type) {
        case ActionType.RECIEVE_DATASETS:
            return {
                ...state,
                datasets: action.datasets,
                recievingDatasets: false
            } as State;
        default:
            return state;
    }
}

export default function DatasetExplorerPage(): JSX.Element {
    // в начальном состоянии стоит флаг о том, что данные загружаются с сервера
    const [state, dispatch] = useReducer(reducer, {
        datasets: [],
        recievingDatasets: true
    });

    // получение датасетов с сервера единожды при загрузке страницы
    useEffect(() => {
        const effect = async () => {
            const result = await fetchDatasets();
            if (!result.isSuccess) {
                console.error(result.error.original);
                return;
            }

            dispatch({
                type: ActionType.RECIEVE_DATASETS,
                datasets: result.data
            });
        };

        effect();
    }, []);

    if (state.recievingDatasets) {
        return <div>Загрузка...</div>;
    }

    return <div>
        <Breadcrumb>
            <Breadcrumb.Item>
                <Link to="/">Главная</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item active>
                Датасеты
            </Breadcrumb.Item>
        </Breadcrumb>
        <h2 className="mt-4">Датасеты</h2>
        <Alert variant="secondary">
            Для загрузки датасетов используйте <a href="https://github.com/Godis715/Markup-Tool/tree/main/client-cli">интерфейс командной строки</a>
        </Alert>
        <ListGroup className="mt-3">
            {
                state.datasets.map(
                    (dataset) => <ListGroup.Item key={dataset.id}>
                        <Link to={`dataset/${dataset.id}`}>
                            <h4>{dataset.name}</h4>
                        </Link>
                        <small className="text-muted">Дата загрузки: {dataset.uploadDate.toLocaleDateString("ru")}</small>
                    </ListGroup.Item>
                )
            }
        </ListGroup>
    </div>;
}
