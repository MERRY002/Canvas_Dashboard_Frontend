import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import ReactFlow, {
  useNodesState,
  useEdgesState,
  addEdge,
  MiniMap,
  Controls,
  Background,
  MarkerType,
  ConnectionLineType,
} from "reactflow";
import "reactflow/dist/style.css";
import { io } from "socket.io-client";
import { nanoid } from "nanoid";

const socket = io("https://canvas-dashboard-frontend.vercel.app");

let id = 0;
const getId = () => `node_${id++}`;

const defaultNode = {
  id: getId(),
  data: { label: "Node 0" },
  position: { x: 250, y: 5 },
  type: "default",
};

const Canvas = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([defaultNode]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [connectingNodeId, setConnectingNodeId] = useState(null);
  

  // Node creation on double-click
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
      setNodes((nds) => [...nds, newNode]);
      socket.emit("add-node", newNode);
    },
    [reactFlowInstance]
  );

  // Right-click context menu
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
      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedNodeId
            ? { ...node, data: { ...node.data, label: newLabel } }
            : node
        )
      );
    }
    setContextMenu(null);
  };

  const handleDelete = () => {
    setNodes((nds) => nds.filter((node) => node.id !== selectedNodeId));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setContextMenu(null);
  };

  // Edge between existing nodes
  const onConnect = useCallback(
    (params) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            markerEnd: { type: MarkerType.ArrowClosed },
            type: ConnectionLineType.SmoothStep,
          },
          eds
        )
      );
    },
    [setEdges]
  );

  // Store source node when dragging starts
  const onConnectStart = useCallback((_, { nodeId }) => {
    setConnectingNodeId(nodeId);
  }, []);

  // Handle edge to empty canvas to create new node
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

        setNodes((nds) => [...nds, newNode]);
        setEdges((eds) => [
          ...eds,
          {
            id: `e${connectingNodeId}-${newNodeId}`,
            source: connectingNodeId,
            target: newNodeId,
            markerEnd: { type: MarkerType.ArrowClosed },
            type: ConnectionLineType.SmoothStep,
          },
        ]);
      }
      setConnectingNodeId(null);
    },
    [reactFlowInstance, connectingNodeId]
  );

  // Socket listeners for real-time sync
  useEffect(() => {
    socket.on("add-node", (node) => {
      setNodes((nds) => [...nds, node]);
    });

    return () => {
      socket.off("add-node");
    };
  }, [setNodes]);

  return (
    <div
      style={{ width: "100vw", height: "100vh" }}
      ref={reactFlowWrapper}
      onDoubleClick={onDoubleClick}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onNodeContextMenu={onNodeContextMenu}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        zoomOnDoubleClick={false}
        fitView
      >
        <MiniMap></MiniMap>
        <Background />
        <Controls />
      </ReactFlow>

      {/* Right-click context menu */}
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
            color: "black", // Text color for visibility
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
