import React, { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Alert from "react-bootstrap/Alert";

type Props = {
    onLogin: (login: string, password: string) => any,
    errorMessage?: string | null
};

type InputChangeEvent = React.ChangeEvent<HTMLInputElement>;

export default function LoginPage(props: Props): JSX.Element {
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");

    const onLoginChange = (ev: InputChangeEvent) => setLogin(ev.target.value);
    const onPasswordChange = (ev: InputChangeEvent) => setPassword(ev.target.value);
    const onLogin = () => {
        props.onLogin(login, password);
    };

    return <Container fluid="md">
        <Row>
            <Col />
            <Col xs={10} md={5} className="mt-5">
                <h3>Вход в систему</h3>
                <Form>
                    <Form.Group>
                        <Form.Label>Логин</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Логин"
                            onChange={onLoginChange}
                        />
                    </Form.Group>

                    <Form.Group>
                        <Form.Label>Пароль</Form.Label>
                        <Form.Control
                            type="password"
                            placeholder="Пароль"
                            onChange={onPasswordChange}
                        />
                    </Form.Group>

                    <Button onClick={onLogin}>Войти</Button>
                    {
                        props.errorMessage &&
                        <Alert variant="danger" className="mt-2">{props.errorMessage}</Alert>
                    }
                </Form>
            </Col>
            <Col />
        </Row>
    </Container>;
}
