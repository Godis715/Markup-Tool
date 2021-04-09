import React, { useEffect, useState } from "react";
import { authenticate, checkIsAuth } from "../../remote/auth";
import { CustomError } from "../../utils/customError";
import LoginPage from "../LoginPage/LoginPage";
import {
    Switch,
    Route,
    Redirect
} from "react-router-dom";
import { setUnauthorizedListener } from "../../remote/api";
import DatasetExplorerPage from "../DatasetExplorerPage/DatasetExplorerPage";
import DatasetPage from "../DatasetPage/DatasetPage";
import MarkupExplorerPage from "../MarkupExplorerPage/MarkupExplorerPage";
import MarkupPage from "../MarkupPage/MarkupPage";
import Header from "../../components/Header/Header";
import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import MarkupConfigPage from "../MarkupConfigPage/MarkupConfigPage";
import FAQPage from "../FAQPage/FAQPage";
import "./App.scss";

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

    const onLogout = () => {
        localStorage.removeItem("Csrf-Access-Token");
        setAuth(AuthState.NOT_AUTHENTICATED);
    };

    return <>
        <Header
            isAuthenticated={auth === AuthState.IS_AUTHENTICATED}
            login={"Вася Пупкин"}
            onLogout={onLogout}
            roles={roles}
        />
        <Container className="mt-5 app">
            <Row>
                <Col>
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
                        <Switch>
                            <Route exact path="/">
                                <Redirect to="/faq/about" />
                            </Route>

                            <Route path="/faq">
                                <FAQPage />
                            </Route>
                            {
                                roles.includes(UserRole.CUSTOMER) &&
                                <Route exact path="/dataset">
                                    <DatasetExplorerPage />
                                </Route>
                            }
                            {
                                roles.includes(UserRole.CUSTOMER) &&
                                <Route exact path="/dataset/:datasetId">
                                    <DatasetPage />
                                </Route>
                            }
                            {
                                roles.includes(UserRole.CUSTOMER) &&
                                <Route exact path="/dataset/:datasetId/markup/:markupId">
                                    <MarkupConfigPage />
                                </Route>
                            }
                            {
                                roles.includes(UserRole.EXPERT) &&
                                <Route exact path="/markup">
                                    <MarkupExplorerPage />
                                </Route>
                            }
                            {
                                roles.includes(UserRole.EXPERT) &&
                                <Route exact path="/markup/:markupId">
                                    <MarkupPage />
                                </Route>
                            }
                            <Route exact path="*">
                                <Redirect to="/faq/about" />
                            </Route>
                        </Switch>
                    }
                </Col>
            </Row>
        </Container>
    </>;
}

export default App;
