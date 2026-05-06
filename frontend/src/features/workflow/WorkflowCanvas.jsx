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
import NodeForm from './NodeForm';
import getLayoutedElements from './useLayout';

const START_NODE = { id: 'start', position: { x: 0, y: 0 }, data: { label: 'Start' }, deletable: false };
const END_NODE = { id: 'end', position: { x: 0, y: 0 }, data: { label: 'End' }, deletable: false };
const INITIAL_EDGE = { id: 'e-start-end', source: 'start', target: 'end' };

const { nodes: initialNodes, edges: initialEdges } = getLayoutedElements(
  [START_NODE, END_NODE],
  [INITIAL_EDGE]
);

function WorkflowCanvas({ onExecute }) {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [nodeCounter, setNodeCounter] = useState(1);

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

  const handleAddNode = ({ label, type, parentId, childId }) => {
    const newId = `node-${nodeCounter}`;
    setNodeCounter((c) => c + 1);

    const newNode = {
      id: newId,
      position: { x: 0, y: 0 },
      data: { label: `${label} (${type})` },
    };

    const updatedEdges = [
      ...edges.filter((e) => !(e.source === parentId && e.target === childId)),
      { id: `e-${parentId}-${newId}`, source: parentId, target: newId },
      { id: `e-${newId}-${childId}`, source: newId, target: childId },
    ];

    const updatedNodes = [...nodes, newNode];

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      updatedNodes,
      updatedEdges
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  };

  const handleExecute = () => {
    if (onExecute) onExecute({ nodes, edges });
  };

  return (
    <div className={styles.container}>
      <NodeForm nodes={nodes} onAddNode={handleAddNode} />

      <div className={styles.main}>
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
    </div>
  );
}

export default WorkflowCanvas;