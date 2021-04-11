import React, { useEffect, useReducer } from "react";
import { Link } from "react-router-dom";
import { fetchMarkups } from "../../remote/api";
import { MarkupForExpert } from "../../types/markup";
import ListGroup from "react-bootstrap/ListGroup";
import Breadcrumb from "react-bootstrap/Breadcrumb";
import { MARKUP_TYPE_LITERALS } from "../../constants/literals";

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

    return <>
        <Breadcrumb>
            <Breadcrumb.Item>
                <Link to="/">Главная</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item active>
                Задания
            </Breadcrumb.Item>
        </Breadcrumb>
        <h3 className="mb-4">Задания</h3>
        <ListGroup>{
            !state.recievingMarkups &&
            state.markups.map(
                (markup) => <ListGroup.Item key={markup.id} className="mb-2">
                    <Link to={`markup/${markup.id}`}>
                        <h4>{markup.datasetName} / {MARKUP_TYPE_LITERALS[markup.type]}</h4>
                    </Link>
                    <small className="text-muted">
                        Создано: {markup.createDate.toLocaleDateString("ru")},
                        Владелец: {markup.owner}
                    </small>
                </ListGroup.Item>
            )
        }</ListGroup>
    </>;
}
