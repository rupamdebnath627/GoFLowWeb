import { useState, useCallback } from 'react';
import ReactFlow, {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Background,
  Controls
} from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes = [
  { id: '1', position: { x: 250, y: 5 }, data: { label: 'Start Task' } },
  { id: '2', position: { x: 250, y: 150 }, data: { label: 'Process Data' } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' }
];

function App() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [status, setStatus] = useState('');

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

  const handleExecute = async () => {
    try {
      const response = await fetch('http://localhost:8080/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nodes, edges })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setStatus(result.message);
    } catch (err) {
      console.error("Error executing workflow:", err);
      setStatus("Failed to connect to backend.");
    }
  };

  return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '10px', backgroundColor: '#282c34', color: 'white', display: 'flex', gap: '10px' }}>
          <button onClick={handleExecute} style={{ padding: '8px 16px', cursor: 'pointer' }}>
            Execute Workflow
          </button>
          <span style={{ alignSelf: 'center' }}>{status}</span>
        </div>

        <div style={{ flex: 1 }}>
          <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              fitView
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
      </div>
  );
}

export default App;