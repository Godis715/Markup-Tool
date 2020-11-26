import React, { useEffect, useReducer } from "react";
import { Link } from "react-router-dom";
import Breadcrumb from "react-bootstrap/Breadcrumb";
import ListGroup from "react-bootstrap/ListGroup";
import Alert from "react-bootstrap/Alert";
import { fetchDatasets } from "../../remote/api";
import { DatasetShort } from "../../types/dataset";
import Skeleton from "react-loading-skeleton";

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
        {/** TODO: добавить возможность искать датасет по названию, навигацию по страницам */}
        <ListGroup className="mt-3">
            {
                !state.recievingDatasets
                    ? state.datasets.map(
                        (dataset) => <ListGroup.Item key={dataset.id}>
                            <Link to={`dataset/${dataset.id}`}>
                                <h4>{dataset.name}</h4>
                            </Link>
                            <small className="text-muted">Дата загрузки: {dataset.uploadDate.toLocaleDateString("ru")}</small>
                        </ListGroup.Item>
                    )
                    // заглушка для загрузки
                    : [1, 2, 3, 4, 5].map(
                        (i) => <ListGroup.Item key={i}>
                            <h4><Skeleton width="15rem" /></h4>
                            <small><Skeleton width="10rem" /></small>
                        </ListGroup.Item>
                    )
            }
        </ListGroup>
    </div>;
}
