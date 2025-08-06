import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./components/App.css";
import "./components/join.css";
import "./components/dashboard.css";
import "./components/sidebar.css";
import "./components/canvas.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
