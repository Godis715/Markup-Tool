import React, { useEffect, useState } from "react";
import { fetchTokens, checkIsAuth, TokensData } from "../../remote/auth";
import { CustomError } from "../../utils/customError";
import LoginPage from "../LoginPage/LoginPage";
import "./App.css";

enum AuthState {
    LOADING,
    IS_AUTHENTICATED,
    NOT_AUTHENTICATED
}

function App(): JSX.Element {
    const [error, setError] = useState<CustomError|null>(null);
    const [auth, setAuth] = useState(AuthState.LOADING);

    useEffect(
        // @ts-ignore
        async () => {
            const csrfAccessToken = localStorage.getItem("Csrf-Access-Token");
            if (!csrfAccessToken) {
                setAuth(AuthState.NOT_AUTHENTICATED);
                return;
            }

            const result = await checkIsAuth(csrfAccessToken);
            if (!result.isSuccess || !result.data) {
                setAuth(AuthState.NOT_AUTHENTICATED);
            }
            else {
                setAuth(AuthState.IS_AUTHENTICATED);
            }
        },
        []
    );

    const onLogin = async (login: string, password: string) => {
        const result = await fetchTokens(login, password);
        if (!result.isSuccess) {
            console.error(result.error.original);
            setError(result.error);
            setAuth(AuthState.NOT_AUTHENTICATED);
        }
        else {
            localStorage.setItem("Csrf-Access-Token", result.data.csrfAccessToken);
            setAuth(AuthState.IS_AUTHENTICATED);
        }
    };

    return (
        auth === AuthState.LOADING
            ? <div>Loading</div>
            : auth === AuthState.IS_AUTHENTICATED
                ? <div>Is authenticated</div>
                : <LoginPage
                    errorMessage={error?.type}
                    onLogin={onLogin}
                />
    );
}

export default App;
