import React, { useState } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Nav from "react-bootstrap/Nav";
import { Link, Redirect, Route, useRouteMatch } from "react-router-dom";
import Switch from "react-bootstrap/esm/Switch";
import UploadDatasetFAQPage from "./UploadDatasetFAQPage";
import "./style.scss";
import AboutPageFAQ from "./AboutPageFAQ";

export default function FAQPage(): JSX.Element {
    const { url } = useRouteMatch();
    const [activeSection, setActiveSection] = useState<string|null>("about");

    return <Container className="faq-page">
        <Row>
            <Col xs="auto">
                <Nav activeKey={activeSection} onSelect={setActiveSection}>
                    <Nav.Item>
                        <Nav.Link as={Link} to={`${url}/about`} eventKey="about">
                            О проекте
                        </Nav.Link>
                        <Nav.Link as={Link} to={`${url}/dataset-uploading`} eventKey="dataset-uploading">
                            Загрузка датасета
                        </Nav.Link>
                    </Nav.Item>
                </Nav>
            </Col>
            <Col>
                <Switch>
                    <Route path={`${url}/dataset-uploading`}>
                        <UploadDatasetFAQPage />
                    </Route>
                    <Route path={`${url}/about`}>
                        <AboutPageFAQ />
                    </Route>
                    <Route path="/">
                        <Redirect to={`${url}/about`} />
                    </Route>
                </Switch>
            </Col>
        </Row>
    </Container>;
}
