import React, { useEffect, useReducer } from "react";
import { Link } from "react-router-dom";
import { fetchMarkups } from "../../remote/api";
import { MarkupForExpert } from "../../types/markup";

enum ActionType {
    RECIEVE_MARKUPS
}

type Action = {
    type: ActionType.RECIEVE_MARKUPS,
    markups: MarkupForExpert[]
}

type State = {
    markups: MarkupForExpert[],
    recievingMarkups: boolean
};

function reducer(state: State, action: Action): State {
    switch(action.type) {
        case ActionType.RECIEVE_MARKUPS:
            return {
                ...state,
                markups: action.markups,
                recievingMarkups: false
            } as State;
        default:
            return state;
    }
}

export default function MarkupExplorerPage(): JSX.Element {
    // в начальном состоянии стоит флаг о том, что данные загружаются с сервера
    const [state, dispatch] = useReducer(reducer, {
        markups: [],
        recievingMarkups: true
    });

    // получение датасетов с сервера единожды при загрузке страницы
    useEffect(() => {
        const effect = async () => {
            const result = await fetchMarkups();
            if (!result.isSuccess) {
                console.error(result.error.original);
                return;
            }

            dispatch({
                type: ActionType.RECIEVE_MARKUPS,
                markups: result.data
            });
        };

        effect();
    }, []);

    return <div>
        <div>Markups:</div>
        {
            state.recievingMarkups
                ? "Loading..."
                : <ul>{
                    state.markups.map(
                        (markup) => <li key={markup.id}>
                            <div>{markup.id}</div>
                            <div>type: {markup.type}</div>
                            <div>owner: {markup.owner}</div>
                            <div>create date: {markup.createDate.toLocaleDateString("ru")}</div>
                            <Link to={`markup/${markup.id}`}>Open</Link>
                        </li>
                    )
                }</ul>
        }
    </div>;
}
