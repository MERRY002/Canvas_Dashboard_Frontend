import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactFlow, {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MiniMap,
  Controls,
  Background,
  MarkerType,
  ConnectionLineType,
} from "reactflow";
import "reactflow/dist/style.css";

let id = 0;
const getId = () => `node_${id++}`;

const Canvas = ({ nodes, edges, setNodes, setEdges, socket, roomId }) => {
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [connectingNodeId, setConnectingNodeId] = useState(null);

  const onDoubleClick = useCallback(
    (event) => {
      if (!reactFlowInstance) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const newNode = {
        id: getId(),
        data: { label: `Node ${id}` },
        position,
        type: "default",
      };

      const updatedNodes = [...nodes, newNode];
      setNodes(updatedNodes);
      socket.emit("addNode", { node: newNode, roomId }); // 🔌 Emit new node
    },
    [reactFlowInstance, nodes, setNodes, socket, roomId]
  );

  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    setSelectedNodeId(node.id);
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
    });
  }, []);

  const handleRename = () => {
    const newLabel = prompt("Enter new name:");
    if (newLabel) {
      const updatedNodes = nodes.map((node) =>
        node.id === selectedNodeId
          ? { ...node, data: { ...node.data, label: newLabel } }
          : node
      );
      setNodes(updatedNodes);
      socket.emit("updateNodes", { nodes: updatedNodes, roomId }); // 🔌 Emit rename
    }
    setContextMenu(null);
  };

  const handleDelete = () => {
    const updatedNodes = nodes.filter((node) => node.id !== selectedNodeId);
    const updatedEdges = edges.filter(
      (e) => e.source !== selectedNodeId && e.target !== selectedNodeId
    );
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    socket.emit("deleteNode", { nodeId: selectedNodeId, roomId }); // 🔌 Emit delete
    setContextMenu(null);
  };

  const onConnect = useCallback(
    (params) => {
      const edge = {
        ...params,
        markerEnd: { type: MarkerType.ArrowClosed },
        type: ConnectionLineType.SmoothStep,
      };
      const updatedEdges = addEdge(edge, edges);
      setEdges(updatedEdges);
      socket.emit("addEdge", { edge, roomId }); // 🔌 Emit new edge
    },
    [edges, setEdges, socket, roomId]
  );

  const onConnectStart = useCallback((_, { nodeId }) => {
    setConnectingNodeId(nodeId);
  }, []);

  const onConnectEnd = useCallback(
    (event) => {
      const targetIsPane = event.target.classList.contains("react-flow__pane");
      if (targetIsPane && reactFlowInstance && connectingNodeId) {
        const bounds = reactFlowWrapper.current.getBoundingClientRect();
        const position = reactFlowInstance.project({
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        });

        const newNodeId = getId();
        const newNode = {
          id: newNodeId,
          data: { label: `Node ${id}` },
          position,
          type: "default",
        };

        const newEdge = {
          id: `e${connectingNodeId}-${newNodeId}`,
          source: connectingNodeId,
          target: newNodeId,
          markerEnd: { type: MarkerType.ArrowClosed },
          type: ConnectionLineType.SmoothStep,
        };

        const updatedNodes = [...nodes, newNode];
        const updatedEdges = [...edges, newEdge];

        setNodes(updatedNodes);
        setEdges(updatedEdges);

        socket.emit("addNode", { node: newNode, roomId }); // 🔌 Emit new node
        socket.emit("addEdge", { edge: newEdge, roomId }); // 🔌 Emit new edge
      }
      setConnectingNodeId(null);
    },
    [reactFlowInstance, connectingNodeId, nodes, edges, setNodes, setEdges, socket, roomId]
  );

  // 🔁 Apply incoming changes from socket
  useEffect(() => {
    if (!socket) return;

    socket.on("syncNodes", (incomingNodes) => {
      setNodes(incomingNodes);
    });

    socket.on("syncEdges", (incomingEdges) => {
      setEdges(incomingEdges);
    });

    socket.on("nodeAdded", ({ node }) => {
      setNodes((prev) => [...prev, node]);
    });

    socket.on("edgeAdded", ({ edge }) => {
      setEdges((prev) => [...prev, edge]);
    });

    socket.on("nodeDeleted", ({ nodeId }) => {
      setNodes((prev) => prev.filter((n) => n.id !== nodeId));
      setEdges((prev) => prev.filter((e) => e.source !== nodeId && e.target !== nodeId));
    });

    return () => {
      socket.off("syncNodes");
      socket.off("syncEdges");
      socket.off("nodeAdded");
      socket.off("edgeAdded");
      socket.off("nodeDeleted");
    };
  }, [socket]);

  return (
    <div
      style={{ width: "100vw", height: "100vh" }}
      ref={reactFlowWrapper}
      onDoubleClick={onDoubleClick}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={(changes) => {
          const updated = applyNodeChanges(changes, nodes);
          setNodes(updated);
          socket.emit("updateNodes", { nodes: updated, roomId }); // 🔌 Emit move/drag
        }}
        onEdgesChange={(changes) => {
          const updated = applyEdgeChanges(changes, edges);
          setEdges(updated);
          socket.emit("updateEdges", { edges: updated, roomId }); // 🔌 Emit edge changes
        }}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onNodeContextMenu={onNodeContextMenu}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        zoomOnDoubleClick={false}
        fitView
      >
        <MiniMap />
        <Background />
        <Controls />
      </ReactFlow>

      {contextMenu && (
        <div
          style={{
            position: "absolute",
            top: contextMenu.mouseY,
            left: contextMenu.mouseX,
            backgroundColor: "white",
            border: "1px solid #ccc",
            padding: "8px",
            borderRadius: "4px",
            zIndex: 1000,
            color: "black",
            boxShadow: "0px 2px 6px rgba(0,0,0,0.2)",
          }}
        >
          <div style={{ padding: "4px", cursor: "pointer" }} onClick={handleRename}>
            Rename
          </div>
          <div style={{ padding: "4px", cursor: "pointer" }} onClick={handleDelete}>
            Delete
          </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;