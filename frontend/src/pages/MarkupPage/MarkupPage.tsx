import React, { useEffect, useReducer } from "react";
import { Link } from "react-router-dom";
import { fetchMarkup, fetchNextMarkupItem, postMarkupItemResult } from "../../remote/api";
import { MarkupForExpert } from "../../types/markup";
import { MarkupItem, MarkupItemResult } from "../../types/markupItem";

// TODO: добавить случай, когда все MarkupItem закончились
enum ActionType {
    RECIEVE_MARKUP,
    START_FETCHING_MARKUP_ITEM,
    RECIEVE_MARKUP_ITEM,
    SET_RESULT,
    START_SENDING_RESULT,
    SENT_RESULT
}

type Action = {
    type: ActionType.RECIEVE_MARKUP,
    markup: MarkupForExpert
} | {
    type: ActionType.START_FETCHING_MARKUP_ITEM
} | {
    type: ActionType.RECIEVE_MARKUP_ITEM,
    markupItem: MarkupItem
} | {
    type: ActionType.START_SENDING_RESULT
} | {
    type: ActionType.SET_RESULT
} | {
    type: ActionType.SENT_RESULT
};

type State = {
    // null, когда markup & markupItem не были загружен
    markup: MarkupForExpert | null,
    recievingMarkup: boolean,
    markupItem: MarkupItem | null,
    recievingMarkupItem: boolean,
    result: MarkupItemResult | null,
    sendingResult: boolean
};

function reducer(state: State, action: Action): State {
    switch(action.type) {
        case ActionType.RECIEVE_MARKUP:
            return {
                ...state,
                markup: action.markup,
                recievingMarkup: false,
                result: action.markup.type === "classification"
                    ? ""
                    : {
                        x1: null,
                        x2: null,
                        y1: null,
                        y2: null
                    }
            } as State;
        case ActionType.START_FETCHING_MARKUP_ITEM:
            return {
                ...state,
                recievingMarkupItem: true
            };
        case ActionType.RECIEVE_MARKUP_ITEM:
            return {
                ...state,
                markupItem: action.markupItem,
                recievingMarkupItem: false
            };
        case ActionType.START_SENDING_RESULT:
            return {
                ...state,
                sendingResult: true
            };
        case ActionType.SENT_RESULT:
            return {
                ...state,
                sendingResult: false
            };
        default:
            return state;
    }
}

type Props = {
    markupId: string
};

export default function MarkupPage(props: Props): JSX.Element {
    const [state, dispatch] = useReducer(reducer, {
        // markup единожды запрашивается с сервера при загрузке страницы
        markup: null,
        recievingMarkup: true,
        // запрашивается с сервера каждый раз, как только эксперт завершил работу
        // с текущим элементом разметки
        markupItem: null,
        recievingMarkupItem: true,
        result: null,
        sendingResult: false
    });

    const startFetchingNextMarkupItem = async () => {
        dispatch({
            type: ActionType.START_FETCHING_MARKUP_ITEM
        });

        const result = await fetchNextMarkupItem(props.markupId);
        console.log(result);

        if (!result.isSuccess) {
            console.error(result.error.original);
            return;
        }

        dispatch({
            type: ActionType.RECIEVE_MARKUP_ITEM,
            markupItem: result.data
        });
    };

    const onSendResult = async () => {
        dispatch({
            type: ActionType.START_SENDING_RESULT
        });

        if (!state.result) {
            return;
        }

        const result = await postMarkupItemResult(props.markupId, state.result);

        if (!result.isSuccess) {
            console.error(result.error.original);
            return;
        }

        dispatch({
            type: ActionType.SENT_RESULT
        });

        await startFetchingNextMarkupItem();
    };

    // получение датасетов с сервера единожды при загрузке страницы
    useEffect(() => {
        const startFetchingMarkup = async () => {
            const result = await fetchMarkup(props.markupId);

            if (!result.isSuccess) {
                console.error(result.error.original);
                return;
            }

            dispatch({
                type: ActionType.RECIEVE_MARKUP,
                markup: result.data
            });
        };

        startFetchingNextMarkupItem();
        startFetchingMarkup();
    }, []);

    return <div>
        <Link to="/markup">Back to markups</Link>
        <div>{
            state.recievingMarkup
                ? "Loading markup..."
                : <>
                    <div>
                        <div>type: {state.markup?.type}</div>
                        <div>owner: {state.markup?.owner}</div>
                        <div>create date: {state.markup?.createDate.toLocaleDateString("ru")}</div>
                    </div>

                    <div>
                        {
                            state.markup?.type === "classification" &&
                            <div>radio buttons...</div>
                        }
                        {
                            state.markup?.type === "recognition" &&
                            <div>four number inputs ...</div>
                        }
                    </div>
                </>
        }</div>

        <div>{
            state.recievingMarkupItem
                ? "Loading markup item..."
                // в данном случае markupItem не может быть undefined
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                : <img src={`http://localhost:8000/images/${state.markupItem?.imageSrc}`} alt="markup item" />
        }</div>
    </div>;
}
