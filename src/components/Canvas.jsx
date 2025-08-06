import React, { useState, useEffect } from "react";
import ReactFlow, {
    MiniMap,
    Controls,
    Background,
    applyNodeChanges,
    useReactFlow
} from "reactflow";
import "reactflow/dist/style.css";
import "./canvas.css";

export default function Canvas({ nodes, setNodes, socket, roomId }) {
    const [menu, setMenu] = useState({ visible: false, x: 0, y: 0, nodeId: null });
    const { project } = useReactFlow();
    useEffect(() => {
        if (!socket) return;
        socket.on("update-nodes", (data) => {
            setNodes(data);
        });
        return () => socket.off("update-nodes");
    }, [socket, setNodes]);
    const onCanvasDoubleClick = (event, flowEvent) => {
        if (flowEvent?.node) return;

        const flowPosition = project({ x: event.clientX, y: event.clientY });
        const id = `${+new Date()}`;
        const newNode = {
            id,
            type: "default",
            data: { label: `Node ${id}` },
            position: flowPosition
        };

        const updatedNodes = [...nodes, newNode];
        setNodes(updatedNodes);
        socket.emit("node-update", { roomId, nodes: updatedNodes });
    };

    const onNodesChange = (changes) => {
        const updatedNodes = applyNodeChanges(changes, nodes);
        setNodes(updatedNodes);
        socket.emit("node-update", { roomId, nodes: updatedNodes });
    };

    const onNodeContextMenu = (event, node) => {
        event.preventDefault();
        setMenu({ visible: true, x: event.clientX, y: event.clientY, nodeId: node.id });
    };

    const handleRename = () => {
        const newLabel = prompt("Enter new label", "");
        if (newLabel) {
            socket.emit("node-rename", { roomId, nodeId: menu.nodeId, newLabel });
        }
        setMenu({ ...menu, visible: false });
    };

    const handleDelete = () => {
        socket.emit("node-delete", { roomId, nodeId: menu.nodeId });
        setMenu({ ...menu, visible: false });
    };

    return (
        <div className="canvas-container">
            <ReactFlow
                nodes={nodes}
                onNodesChange={onNodesChange}
                onNodeContextMenu={onNodeContextMenu}
                onDoubleClick={onCanvasDoubleClick}
                fitView
            >
                <MiniMap />
                <Controls />
                <Background />
            </ReactFlow>

            {menu.visible && (
                <div
                    className="context-menu"
                    style={{ top: menu.y, left: menu.x }}
                >
                    <div onClick={handleRename}>Rename</div>
                    <div onClick={handleDelete}>Delete</div>
                </div>
            )}
        </div>
    );
}