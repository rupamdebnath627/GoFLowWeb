import { useState, useCallback, useMemo, useRef } from 'react';
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
import CustomNode from './CustomNode';
import getLayoutedElements from './useLayout';

const START_NODE = { id: 'start', position: { x: 0, y: 0 }, data: { label: 'Start' }, type: 'custom', deletable: false };
const END_NODE = { id: 'end', position: { x: 0, y: 0 }, data: { label: 'End' }, type: 'custom', deletable: false };
const INITIAL_EDGE = { id: 'e-start-end', source: 'start', target: 'end' };

const { nodes: initialNodes, edges: initialEdges } = getLayoutedElements(
  [START_NODE, END_NODE],
  [INITIAL_EDGE]
);

function WorkflowCanvas({ onExecute }) {
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const nodeCounterRef = useRef(1);

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  nodesRef.current = nodes;
  edgesRef.current = edges;

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
    const newId = `node-${nodeCounterRef.current}`;
    nodeCounterRef.current += 1;

    const newNode = {
      id: newId,
      position: { x: 0, y: 0 },
      type: 'custom',
      data: { label: `${label} (${type})` },
    };

    const updatedEdges = [
      ...edgesRef.current.filter((e) => !(e.source === parentId && e.target === childId)),
      { id: `e-${parentId}-${newId}`, source: parentId, target: newId },
      { id: `e-${newId}-${childId}`, source: newId, target: childId },
    ];

    const updatedNodes = [...nodesRef.current, newNode];

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      updatedNodes,
      updatedEdges
    );

    nodesRef.current = layoutedNodes;
    edgesRef.current = layoutedEdges;
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
            nodeTypes={nodeTypes}
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