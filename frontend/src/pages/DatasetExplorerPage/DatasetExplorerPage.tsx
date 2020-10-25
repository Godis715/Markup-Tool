import React, { useEffect, useReducer } from "react";
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

    return <div>{
        state.recievingDatasets
            ? "Loading..."
            : <>
                <div>Datasets:</div>
                <ul>{
                    state.datasets.map(
                        (dataset) => <li key={dataset.id}>{dataset.name}</li>
                    )
                }</ul>
            </>
    }</div>;
}
