import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import Sidebar from "./Sidebar";
import Canvas from "./Canvas.jsx";
import { ReactFlowProvider } from "reactflow";
import "./dashboard.css";

const socket = io(process.env.REACT_APP_BACKEND_URL, {
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ["websocket"],
});

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomId = searchParams.get("room");
  const username = searchParams.get("user");

  const [users, setUsers] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [socketError, setSocketError] = useState("");

  useEffect(() => {
    if (!roomId || !username) {
      navigate("/");
      return;
    }

    socket.emit("join-room", { roomId, username });

    socket.on("connect_error", () => setSocketError("⚠ Unable to connect to server."));
    socket.on("disconnect", () => setSocketError("⚠ Disconnected from server."));
    socket.on("reconnect_error", () => setSocketError("⚠ Failed to reconnect."));

    socket.on("update-users", (data) => setUsers(data));
    socket.on("user-joined", (name) => showNotification(`${name} joined the room`));
    socket.on("user-left", (name) => showNotification(`${name} left the room`));

    socket.on("syncNodes", (data) => setNodes(data));
    socket.on("syncEdges", (data) => setEdges(data));

    return () => {
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

  const updateEdges = (newEdges) => {
    setEdges(newEdges);
    socket.emit("edge-update", { roomId, edges: newEdges });
  };

  return (
    <div className="dashboard">
      {socketError && <div className="error-banner">{socketError}</div>}
      <Sidebar users={users} roomId={roomId} />
      <ReactFlowProvider>
        <Canvas
          nodes={nodes}
          setNodes={updateNodes}
          edges={edges}
          setEdges={updateEdges}
          socket={socket}
          roomId={roomId}
        />
      </ReactFlowProvider>
      <div className="notifications">
        {notifications.map((n, i) => (
          <div key={i} className="notification">{n}</div>
        ))}
      </div>
    </div>
  );
}
