import React, { useEffect, useReducer } from "react";
import { fetchDataset } from "../../remote/api";
import { DatasetDetailed } from "../../types/dataset";

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

type Props = {
    datasetId: string
};

export default function DatasetPage(props: Props): JSX.Element {
    // в начальном состоянии стоит флаг о том, что данные загружаются с сервера
    const [state, dispatch] = useReducer(reducer, {
        dataset: null,
        recievingDataset: true
    });

    // получение датасетов с сервера единожды при загрузке страницы
    useEffect(() => {
        const effect = async () => {
            const result = await fetchDataset(props.datasetId);

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

    return <div>{
        state.recievingDataset
            ? "Loading..."
            : <div>
                <div>{state.dataset?.name}</div>
                <div>Markups:</div>
                <li>{
                    state.dataset?.markups.map(
                        (markup) => <ul key={markup.id}>
                            <div>{markup.id}</div>
                            <div>{markup.type}</div>
                        </ul>
                    )
                }</li>
            </div>
    }</div>;
}
