import React, {useState} from "react";
import {useNavigate} from "react-router-dom";
import "../styles/join.css";

export default function JoinPage(){
    const [roomId, setRoomId]=useState("");
    const [username, setUsername]=useState("");
    const [error, setError]=useState("");
    const navigate=useNavigate();

    const joinRoom=()=>{
        if(!roomId.trim() || !username.trim()){
            setError("Both Room ID and Username are required!");
            return;
        }
        navigate(`/Dashboard?room=${roomId}&user=${username}`);
    };
    const createNewRoom =()=>{
        const id=Math.random().toString(36).substring(2,6);
        setRoomId(id);
        setError("");
    };
    return (
        <div className="join-container">
            <div className="join-box">
                <h2>Welcome To This Dashboard</h2>
                {error && <p className="error">{error}</p>}
                <input placeholder="ROOM ID" value={roomId}  onChange={e=>setRoomId(e.target.value)}></input>
                <input placeholder="USERNAME" value={username}  onChange={e=>setUsername(e.target.value)}></input>
                <button onClick={joinRoom}>Join</button>
                <p className="new">If you don't have an invite, create a{" "}<span className="link" onClick={createNewRoom}>new room</span></p>
            </div>
        </div>
    );
}