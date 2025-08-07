import React, { useState, useRef } from "react";
import {ReactFlow,
    MiniMap,
    Controls,
    Background,
    applyNodeChanges,
} from "reactflow";
import "reactflow/dist/style.css";
import "./canvas.css";

export default function Canvas({ nodes, setNodes, socket, roomId }) {
    const [menu, setMenu] = useState({ visible: false, x: 0, y: 0, nodeId: null });
    const reactFlowWrapper = useRef(null);

    // Handle node changes (position, rename label, etc.)
    const onNodesChange = (changes) => {
        const updated = applyNodeChanges(changes, nodes);
        setNodes(updated);
        socket.emit("node-update", { roomId, nodes: updated });
    };

    // Add new node on double click
    const onPaneDoubleClick = (event) => {
        const bounds = reactFlowWrapper.current.getBoundingClientRect();
        const position = {
            x: event.clientX - bounds.left - 75,
            y: event.clientY - bounds.top - 25
        };
        const id = `node-${Date.now()}`;
        const newNode = {
            id,
            data: { label: `Node ${id}` },
            position
        };
        const updated = [...nodes, newNode];
        setNodes(updated);
        socket.emit("node-update", { roomId, nodes: updated });
    };

    // Right click to open context menu
    const onNodeContextMenu = (event, node) => {
        event.preventDefault();
        setMenu({
            visible: true,
            x: event.clientX,
            y: event.clientY,
            nodeId: node.id
        });
    };

    // Rename node
    const handleRename = () => {
        const newLabel = prompt("Enter new label");
        if (newLabel && newLabel.trim()) {
            const updated = nodes.map((n) =>
                n.id === menu.nodeId ? { ...n, data: { ...n.data, label: newLabel } } : n
            );
            setNodes(updated);
            socket.emit("node-update", { roomId, nodes: updated });
        }
        setMenu({ ...menu, visible: false });
    };

    // Delete node
    const handleDelete = () => {
        const updated = nodes.filter((n) => n.id !== menu.nodeId);
        setNodes(updated);
        socket.emit("node-update", { roomId, nodes: updated });
        setMenu({ ...menu, visible: false });
    };

    // Hide context menu when clicking elsewhere
    const handleClickOutside = () => {
        if (menu.visible) {
            setMenu({ ...menu, visible: false });
        }
    };

    return (
        <div
            style={{ height: "100%", width: "100%" }}
            ref={reactFlowWrapper}
            onClick={handleClickOutside}
        >
            <ReactFlow
                nodes={nodes}
                onNodesChange={onNodesChange}
                onPaneDoubleClick={onPaneDoubleClick}
                onNodeContextMenu={onNodeContextMenu}
                zoomOnScroll={false}
                zoomOnDoubleClick={false}
                panOnScroll
                fitView
            >
                <MiniMap zoomable pannable />
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