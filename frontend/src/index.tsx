import React from "react";
import ReactDOM from "react-dom";
import App from "./pages/App/App";
import { BrowserRouter as Router } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

ReactDOM.render(
    <Router>
        <App />
    </Router>,
    document.getElementById("root")
);
