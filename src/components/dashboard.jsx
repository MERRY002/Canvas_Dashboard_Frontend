import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import Sidebar from "./Sidebar";
import Canvas from "./Canvas";
import { ReactFlowProvider } from "reactflow";
import "./dashboard.css";

const socket = io(process.env.REACT_APP_BACKEND_URL, {
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ["websocket"]
});

export default function Dashboard() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const roomId = searchParams.get("room");
    const username = searchParams.get("user");

    const [users, setUsers] = useState([]);
    const [nodes, setNodes] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [socketError, setSocketError] = useState("");

    useEffect(() => {
        if (!roomId || !username) {
            navigate("/"); // If missing info, go back to join page
            return;
        }

        // Socket error handling
        socket.on("connect_error", () => {
            setSocketError("⚠ Unable to connect to server.");
        });
        socket.on("disconnect", () => {
            setSocketError("⚠ Disconnected from server.");
        });
        socket.on("reconnect_error", () => {
            setSocketError("⚠ Failed to reconnect.");
        });

        // Join the room
        socket.emit("join-room", { roomId, username });

        // Listen for user list updates
        socket.on("update-users", (data) => setUsers(data));

        // Notifications for join/leave
        socket.on("user-joined", (name) => showNotification(`${name} joined the room`));
        socket.on("user-left", (name) => showNotification(`${name} left the room`));

        // Listen for node updates
        socket.on("update-nodes", (data) => setNodes(data));

        return () => {
            socket.off("connect_error");
            socket.off("disconnect");
            socket.off("reconnect_error");
            socket.off("update-users");
            socket.off("user-joined");
            socket.off("user-left");
            socket.off("update-nodes");
            socket.disconnect();
        };
    }, [roomId, username, navigate]);

    const showNotification = (msg) => {
        setNotifications((prev) => [...prev, msg]);
        setTimeout(() => {
            setNotifications((prev) => prev.slice(1));
        }, 5000);
    };

    const updateNodes = (newNodes) => {
        setNodes(newNodes);
        socket.emit("node-update", { roomId, nodes: newNodes });
    };

    return (
        <div className="dashboard">
            {socketError && <div className="error-banner">{socketError}</div>}
            <Sidebar users={users} roomId={roomId} />
            <ReactFlowProvider>
                <Canvas nodes={nodes} setNodes={updateNodes} socket={socket} roomId={roomId} />
            </ReactFlowProvider>
            <div className="notifications">
                {notifications.map((n, i) => (
                    <div key={i} className="notification">{n}</div>
                ))}
            </div>
        </div>
    );
}