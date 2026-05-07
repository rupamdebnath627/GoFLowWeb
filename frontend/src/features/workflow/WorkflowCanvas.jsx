import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  ConnectionLineType,
  Background,
  Controls
} from 'reactflow';
import 'reactflow/dist/style.css';
import styles from './WorkflowCanvas.module.css';
import NodeForm from './NodeForm';
import CustomNode from './CustomNode';
import ConfirmDialog from './ConfirmDialog';
import getLayoutedElements from './useLayout';
import { validateWorkflow } from './validateGraph';

const START_NODE = { id: 'start', position: { x: 0, y: 0 }, data: { label: 'Start' }, type: 'custom', deletable: false };
const END_NODE = { id: 'end', position: { x: 0, y: 0 }, data: { label: 'End' }, type: 'custom', deletable: false };
const INITIAL_EDGE = { id: 'e-start-end', source: 'start', target: 'end' };

const { nodes: initialNodes, edges: initialEdges } = getLayoutedElements(
  [START_NODE, END_NODE],
  [INITIAL_EDGE]
);

function WorkflowCanvas({ onExecute, onGraphChange }) {
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const nodeCounterRef = useRef(1);
  const [pendingDelete, setPendingDelete] = useState(null);

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  nodesRef.current = nodes;
  edgesRef.current = edges;

  useEffect(() => {
    if (onGraphChange) onGraphChange({ nodes, edges });
  }, [nodes, edges, onGraphChange]);

  const applyDeletion = useCallback(({ type, changes }) => {
    if (type === 'nodes') {
      const removedIds = new Set(changes.filter((c) => c.type === 'remove').map((c) => c.id));
      setNodes((nds) => {
        const updatedNodes = applyNodeChanges(changes, nds);
        setEdges((eds) => {
          const updatedEdges = eds.filter(
            (e) => !removedIds.has(e.source) && !removedIds.has(e.target)
          );
          const { nodes: ln, edges: le } = getLayoutedElements(updatedNodes, updatedEdges);
          nodesRef.current = ln;
          edgesRef.current = le;
          setNodes(ln);
          return le;
        });
        return updatedNodes;
      });
    } else {
      setEdges((eds) => {
        const updatedEdges = applyEdgeChanges(changes, eds);
        const { nodes: ln, edges: le } = getLayoutedElements(nodesRef.current, updatedEdges);
        nodesRef.current = ln;
        edgesRef.current = le;
        setNodes(ln);
        return le;
      });
    }
  }, []);

  const simulateDeletion = useCallback((type, changes) => {
    const removals = changes.filter((c) => c.type === 'remove');
    if (removals.length === 0) return null;

    let simNodes, simEdges;
    if (type === 'nodes') {
      const removedIds = new Set(removals.map((c) => c.id));
      simNodes = nodesRef.current.filter((n) => !removedIds.has(n.id));
      simEdges = edgesRef.current.filter(
        (e) => !removedIds.has(e.source) && !removedIds.has(e.target)
      );
    } else {
      const removedIds = new Set(removals.map((c) => c.id));
      simNodes = nodesRef.current;
      simEdges = edgesRef.current.filter((e) => !removedIds.has(e.id));
    }

    return validateWorkflow(simNodes, simEdges);
  }, []);

  const describeRemovals = useCallback((type, changes) => {
    const removals = changes.filter((c) => c.type === 'remove');
    if (type === 'nodes') {
      const labels = removals.map((c) => {
        const node = nodesRef.current.find((n) => n.id === c.id);
        return node ? node.data.label : c.id;
      });
      return `Deleting node${labels.length > 1 ? 's' : ''}: ${labels.join(', ')}`;
    } else {
      const descs = removals.map((c) => {
        const edge = edgesRef.current.find((e) => e.id === c.id);
        if (!edge) return c.id;
        const srcNode = nodesRef.current.find((n) => n.id === edge.source);
        const tgtNode = nodesRef.current.find((n) => n.id === edge.target);
        const src = srcNode ? srcNode.data.label : edge.source;
        const tgt = tgtNode ? tgtNode.data.label : edge.target;
        return `${src} → ${tgt}`;
      });
      return `Deleting edge${descs.length > 1 ? 's' : ''}: ${descs.join(', ')}`;
    }
  }, []);

  const onNodesChange = useCallback(
    (changes) => {
      const removals = changes.filter((c) => c.type === 'remove');
      if (removals.length > 0) {
        const errors = simulateDeletion('nodes', changes);
        if (errors && errors.length > 0) {
          setPendingDelete({
            type: 'nodes',
            changes,
            message: describeRemovals('nodes', changes),
            warnings: errors,
          });
          return;
        }
        applyDeletion({ type: 'nodes', changes });
      } else {
        setNodes((nds) => applyNodeChanges(changes, nds));
      }
    },
    [simulateDeletion, describeRemovals, applyDeletion]
  );

  const onEdgesChange = useCallback(
    (changes) => {
      const removals = changes.filter((c) => c.type === 'remove');
      if (removals.length > 0) {
        const errors = simulateDeletion('edges', changes);
        if (errors && errors.length > 0) {
          setPendingDelete({
            type: 'edges',
            changes,
            message: describeRemovals('edges', changes),
            warnings: errors,
          });
          return;
        }
        applyDeletion({ type: 'edges', changes });
      } else {
        setEdges((eds) => applyEdgeChanges(changes, eds));
      }
    },
    [simulateDeletion, describeRemovals, applyDeletion]
  );

  const handleConfirmDelete = useCallback(() => {
    if (pendingDelete) {
      applyDeletion({ type: pendingDelete.type, changes: pendingDelete.changes });
      setPendingDelete(null);
    }
  }, [pendingDelete, applyDeletion]);

  const handleCancelDelete = useCallback(() => {
    setPendingDelete(null);
  }, []);

  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge({ ...connection, type: 'smoothstep', markerEnd: { type: 'arrowclosed', width: 15, height: 15 } }, eds)),
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
            connectionLineType={ConnectionLineType.SmoothStep}
            fitView
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
      </div>

      {pendingDelete && (
        <ConfirmDialog
          message={pendingDelete.message}
          warnings={pendingDelete.warnings}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
}

export default WorkflowCanvas;