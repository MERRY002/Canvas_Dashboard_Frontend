import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/sidebar.css";

export default function Sidebar({ users, roomId, socket }) {
    const navigate = useNavigate();
    const handleLeave = () => {
        if (socket) {
            socket.disconnect();
        }
        navigate("/");
    };
    return (
        <div className="sidebar">
            <h2>Dashboard</h2>
            <div className="connected-users">
                <h3>Connected</h3>
                <ul>
                    {users.map((user, index) => (
                        <li key={index}>{user.username || user}</li>
                    ))}
                </ul>
            </div>
            <div className="room-controls">
                <button onClick={() => navigator.clipboard.writeText(roomId)}>
                    Copy Room ID
                </button>
                <button onClick={handleLeave} className="leave-btn">
                    Leave
                </button>
            </div>
        </div>
    );
}