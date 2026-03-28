import React, { useCallback, useState } from 'react';
import ReactFlow, { MiniMap, Controls, Background, addEdge, applyEdgeChanges, applyNodeChanges } from 'react-flow-renderer';

// simple nodes representing the different agent types; you can extend these or
// generate them dynamically from the agent templates stored in the database.
const initialNodes = [
  {
    id: '1',
    type: 'default',
    data: { label: '👩‍💼 Customer Support' },
    position: { x: 0, y: 0 },
    className: 'shift-node'
  },
  {
    id: '2',
    type: 'default',
    data: { label: '✉️ E‑mail Reader/Writer' },
    position: { x: 250, y: 100 },
    className: 'shift-node'
  },
  {
    id: '3',
    type: 'default',
    data: { label: '📅 Reservation Agent' },
    position: { x: 500, y: 0 },
    className: 'shift-node'
  }
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e2-3', source: '2', target: '3', animated: true }
];

const AgentFlowEditor = () => {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    []
  );

  return (
    <div className="flow-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        zoomOnScroll={false}
        nodesDraggable
        nodesConnectable
        elementsSelectable
      >
        <MiniMap
          nodeStrokeColor={(n) => (n.selected ? '#8B5CF6' : '#555')}
          nodeColor={(n) => (n.selected ? '#8B5CF6' : '#333')}
        />
        <Controls />
        <Background gap={16} />
      </ReactFlow>
    </div>
  );
};

export default AgentFlowEditor;
