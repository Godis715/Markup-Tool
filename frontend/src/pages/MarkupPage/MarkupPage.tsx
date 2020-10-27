import React, { useEffect, useReducer, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMarkup, fetchNextMarkupItem, postMarkupItemResult } from "../../remote/api";
import { MarkupForExpert } from "../../types/markup";
import { MarkupItem, MarkupItemResult } from "../../types/markupItem";
import { CustomErrorType } from "../../utils/customError";
import ClassificationTool from "./ClassificationTool/ClassificationTool";

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
    sendingResult: boolean,
    isFinished: boolean
};

function reducer(state: State, action: Action): State {
    switch(action.type) {
        case ActionType.RECIEVE_MARKUP:
            return {
                ...state,
                markup: action.markup,
                recievingMarkup: false
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
        sendingResult: false,
        isFinished: false
    });

    const [isFinished, setIsFinished] = useState(false);

    const startFetchingNextMarkupItem = async () => {
        dispatch({
            type: ActionType.START_FETCHING_MARKUP_ITEM
        });

        const result = await fetchNextMarkupItem(props.markupId);
        console.log(result);

        if (!result.isSuccess) {
            // это может быть ошибка, гласящая о том, что больше нет элементов для разметки
            if (result.error.type === CustomErrorType.NOT_FOUND) {
                setIsFinished(true);
                return;
            }

            console.error(result.error.original);
            return;
        }

        dispatch({
            type: ActionType.RECIEVE_MARKUP_ITEM,
            markupItem: result.data
        });
    };

    const onSendResult = async (markupItemResult: MarkupItemResult) => {
        dispatch({
            type: ActionType.START_SENDING_RESULT
        });

        const result = await postMarkupItemResult(props.markupId, markupItemResult);
        console.log(result);

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

    const absImageSrc = state.markupItem && `http://localhost:8000/images/${state.markupItem?.imageSrc}`;

    return <div>
        <Link to="/markup">Back to markups</Link>
        <div>
            {/** Такое избычтоное количество условий ниже - чтобы избежать большой вложенности */}
            {
                state.recievingMarkup &&
                <div>Загрузка данных...</div>
            }
            {
                isFinished &&
                <div>Больше нет элементов для разметки</div>
            }
            {
                !isFinished &&
                !state.recievingMarkup &&
                <>
                    <div>
                        <div>type: {state.markup?.type}</div>
                        <div>owner: {state.markup?.owner}</div>
                        <div>create date: {state.markup?.createDate.toLocaleDateString("ru")}</div>
                    </div>

                    {
                        /** TODO: добавить условие на то, если вдруг элемент еще загружается */
                        absImageSrc && // чтобы типовыводилка не жаловалась
                        state.markup?.type === "classification" &&
                        <ClassificationTool
                            imageSrc={absImageSrc}
                            classes={state.markup.config}
                            onSubmit={onSendResult}
                        />
                    }
                    {
                        state.markup?.type === "recognition" &&
                        <div>four number inputs ...</div>
                    }
                </>
            }
        </div>
    </div>;
}
