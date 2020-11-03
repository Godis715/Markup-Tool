import React, { ReactElement } from "react";
import Navbar from "react-bootstrap/Navbar";
import Button from "react-bootstrap/Button";
import { Nav } from "react-bootstrap";

type Props = {
    login: string,
    isAuthenticated: boolean,
    onLogout: () => void
};

export default function Header(props: Props): ReactElement {
    return <Navbar bg="light" variant="light">
        <Navbar.Brand>
            <Navbar.Text>Markup Tool</Navbar.Text>
        </Navbar.Brand>
        <Navbar.Toggle/>
        {
            props.isAuthenticated &&
            <Navbar.Collapse className="justify-content-end">
                <div>
                    <Navbar.Text>{props.login}</Navbar.Text>
                    <Button onClick={props.onLogout} variant="outline-primary" className="ml-2">Выход</Button>
                </div>
            </Navbar.Collapse>
        }
    </Navbar>;
}
