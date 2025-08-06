import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import JoinPage from "./components/joinPage";
import Dashboard from "./components/dashboard";

export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<JoinPage />} />
                <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
        </Router>
    );
}