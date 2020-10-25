import React, { useEffect, useState } from "react";
import { fetchTokens, checkIsAuth } from "../../remote/auth";
import { CustomError } from "../../utils/customError";
import LoginPage from "../LoginPage/LoginPage";
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Redirect,
    RouteComponentProps
} from "react-router-dom";
import "./App.css";

enum AuthState {
    LOADING,
    IS_AUTHENTICATED,
    NOT_AUTHENTICATED
}

enum UserRole {
    CUSTOMER = "customer",
    EXPERT = "expert"
}

function App(): JSX.Element {
    const [error, setError] = useState<CustomError|null>(null);
    const [auth, setAuth] = useState(AuthState.LOADING);

    useEffect(
        () => {
            const effect = async () => {
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
            };

            effect();
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

    const userRole = Math.random() > 0.5 ? UserRole.CUSTOMER : UserRole.EXPERT;
    return <>
        {
            auth === AuthState.LOADING &&
            <div>Loading</div>
        }
        {
            auth === AuthState.NOT_AUTHENTICATED &&
            <LoginPage
                errorMessage={error?.type}
                onLogin={onLogin}
            />
        }
        {
            auth === AuthState.IS_AUTHENTICATED &&
            <Router>
                <Switch>
                    <Route exact path="/dataset">
                        {
                            userRole === UserRole.CUSTOMER
                                ? <div>Datasets: ...</div>
                                : <Redirect to="/" />
                        }
                    </Route>
                    <Route exact path="/dataset/:datasetId">
                        {
                            userRole === UserRole.CUSTOMER
                                ? (props: RouteComponentProps<{ datasetId: string }>) => {
                                    // eslint-disable-next-line
                                    const { datasetId } = props.match.params;
                                    // eslint-disable-next-line
                                    return datasetId;
                                }
                                : <Redirect to="/" />
                        }
                    </Route>
                    <Route exact path="/markup">
                        {
                            userRole === UserRole.EXPERT
                                ? <div>Markups: ...</div>
                                : <Redirect to="/" />
                        }
                    </Route>
                    <Route exact path="/markup/:markupId">
                        {
                            userRole === UserRole.EXPERT
                                ? (props: RouteComponentProps<{ markupId: string }>) => {
                                    // eslint-disable-next-line
                                    const { markupId } = props.match.params;
                                    // eslint-disable-next-line
                                    return markupId;
                                }
                                : <Redirect to="/" />
                        }
                    </Route>
                </Switch>
            </Router>
        }
    </>;
}

export default App;
