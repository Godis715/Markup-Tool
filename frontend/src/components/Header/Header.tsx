import React, { ReactElement } from "react";
import Navbar from "react-bootstrap/Navbar";
import Button from "react-bootstrap/Button";
import Nav from "react-bootstrap/Nav";
import { Link } from "react-router-dom";

type Props = {
    login: string,
    isAuthenticated: boolean,
    onLogout: () => void,
    roles: string[]
};

export default function Header(props: Props): ReactElement {
    return <Navbar bg="light" variant="light">
        <Navbar.Brand>
            <Navbar.Text>
                <Link to="/">Markup Tool</Link>
            </Navbar.Text>
        </Navbar.Brand>
        <Navbar.Toggle/>
        {
            props.isAuthenticated &&
            <Navbar.Collapse className="justify-content-between">
                <div>
                    {
                        props.roles?.includes("expert") &&
                        <Nav.Link as={Link} to="/markup">Задания</Nav.Link>
                    }
                    {
                        props.roles?.includes("customer") &&
                        <Nav.Link as={Link} to="/dataset">Датасеты</Nav.Link>
                    }
                </div>
                <div>
                    <Navbar.Text>{props.login}</Navbar.Text>
                    <Button onClick={props.onLogout} variant="outline-primary" className="ml-2">Выход</Button>
                </div>
            </Navbar.Collapse>
        }
    </Navbar>;
}
