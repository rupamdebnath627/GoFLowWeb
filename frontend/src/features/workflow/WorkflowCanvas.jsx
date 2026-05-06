import { useState, useCallback } from 'react';
import ReactFlow, {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Background,
  Controls
} from 'reactflow';
import 'reactflow/dist/style.css';
import styles from './WorkflowCanvas.module.css';

const initialNodes = [
  { id: '1', position: { x: 250, y: 5 }, data: { label: 'Start Task' } },
  { id: '2', position: { x: 250, y: 150 }, data: { label: 'Process Data' } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' }
];

function WorkflowCanvas({ onExecute }) {
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

  const handleExecute = () => {
    if (onExecute) onExecute({ nodes, edges });
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <button onClick={handleExecute} className={styles.executeBtn}>
          Execute Workflow
        </button>
      </div>

      <div className={styles.canvas}>
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

export default WorkflowCanvas;