import React, { useEffect, useState } from "react";
import { authenticate, checkIsAuth } from "../../remote/auth";
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
import { setUnauthorizedListener } from "../../remote/api";
import DatasetExplorerPage from "../DatasetExplorerPage/DatasetExplorerPage";
import DatasetPage from "../DatasetPage/DatasetPage";
import MarkupExplorerPage from "../MarkupExplorerPage/MarkupExplorerPage";
import MarkupPage from "../MarkupPage/MarkupPage";

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
    const [roles, setRoles] = useState<UserRole[]>([]);

    useEffect(
        () => setUnauthorizedListener(() => setAuth(AuthState.NOT_AUTHENTICATED)),
        []
    );

    useEffect(() => {
        const effect = async () => {
            const csrfAccessToken = localStorage.getItem("Csrf-Access-Token");
            if (!csrfAccessToken) {
                setAuth(AuthState.NOT_AUTHENTICATED);
                return;
            }

            const result = await checkIsAuth(csrfAccessToken);
            if (!result.isSuccess || !result.data.isAuthenticated) {
                setAuth(AuthState.NOT_AUTHENTICATED);
            }
            else {
                setRoles(
                    result.data.roles.map((role) => role as UserRole)
                );
                setAuth(AuthState.IS_AUTHENTICATED);
            }
        };

        effect();
    }, []);

    const onLogin = async (login: string, password: string) => {
        const result = await authenticate(login, password);
        if (!result.isSuccess) {
            console.error(result.error.original);
            setError(result.error);
            setAuth(AuthState.NOT_AUTHENTICATED);
        }
        else {
            localStorage.setItem("Csrf-Access-Token", result.data.tokens.csrfAccessToken);
            const convertedRoles = result.data.roles.map(
                (role) => role as UserRole
            );
            console.log(convertedRoles);
            setRoles(convertedRoles);
            setAuth(AuthState.IS_AUTHENTICATED);
        }
    };

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
                            roles.includes(UserRole.CUSTOMER)
                                ? <DatasetExplorerPage />
                                : <Redirect to="/" />
                        }
                    </Route>
                    <Route exact path="/dataset/:datasetId">
                        {
                            roles.includes(UserRole.CUSTOMER)
                                // такая конструкция нужна, чтобы передать параметр :datasetId
                                ? (props: RouteComponentProps<{ datasetId: string }>) =>
                                    <DatasetPage
                                        datasetId={props.match.params.datasetId}
                                    />
                                : <Redirect to="/" />
                        }
                    </Route>
                    <Route exact path="/markup">
                        {
                            roles.includes(UserRole.EXPERT)
                                ? <MarkupExplorerPage />
                                : <Redirect to="/" />
                        }
                    </Route>
                    <Route exact path="/markup/:markupId">
                        {
                            roles.includes(UserRole.EXPERT)
                                ? (props: RouteComponentProps<{ markupId: string }>) =>
                                    <MarkupPage
                                        markupId={props.match.params.markupId}
                                    />
                                : <Redirect to="/" />
                        }
                    </Route>
                </Switch>
            </Router>
        }
    </>;
}

export default App;
