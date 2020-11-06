import React, { useEffect, useReducer } from "react";
import { Link } from "react-router-dom";
import { fetchMarkups } from "../../remote/api";
import { MarkupForExpert } from "../../types/markup";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import CardColumns from "react-bootstrap/CardColumns";
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
        <h3 className="mb-4">Задания</h3>
        <CardColumns>{
            state.recievingMarkups
                ? "Loading..."
                : state.markups.map(
                    (markup) => <Card key={markup.id} className="mb-2">
                        <Card.Header>Разметка изображения</Card.Header>
                        <Card.Body>
                            <Card.Text>
                                Тип: {MARKUP_TYPE_LITERALS[markup.type]}
                            </Card.Text>
                            <Link to={`markup/${markup.id}`}>
                                <Button>Открыть</Button>
                            </Link>
                        </Card.Body>
                        <Card.Footer>
                            <small className="text-muted">Создано {markup.createDate.toLocaleDateString("ru")}, {markup.owner}</small>
                        </Card.Footer>
                    </Card>
                )
        }</CardColumns>
    </>;
}
