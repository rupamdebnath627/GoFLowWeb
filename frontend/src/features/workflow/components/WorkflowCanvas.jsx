import { useMemo, useState, useCallback } from 'react';
import ReactFlow, { ConnectionLineType, Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import styles from './styles/WorkflowCanvas.module.css';
import NodeForm from './NodeForm';
import CustomNode from './CustomNode';
import ConfirmDialog from './ConfirmDialog';
import NodeDetailPanel from './NodeDetailPanel';

function WorkflowCanvas({ graph, onExecute, onCancel, isRunning, nodeStatuses }) {
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  const {
    nodes,
    edges,
    pendingDelete,
    onNodesChange,
    onEdgesChange,
    onConnect,
    handleAddNode,
    updateNode,
    handleConfirmDelete,
    handleCancelDelete,
  } = graph;

  // Inject execution status into each node's data so CustomNode can render it
  const nodesWithStatus = useMemo(() => {
    if (!nodeStatuses || Object.keys(nodeStatuses).length === 0) return nodes;
    return nodes.map((node) => {
      const execStatus = nodeStatuses[node.id];
      if (!execStatus) return node;
      return { ...node, data: { ...node.data, execStatus: execStatus.status, execOutput: execStatus.output } };
    });
  }, [nodes, nodeStatuses]);

  const selectedNode = selectedNodeId ? nodesWithStatus.find((n) => n.id === selectedNodeId) : null;

  const onNodeClick = useCallback((_event, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const handleNodeSave = useCallback((nodeId, data) => {
    updateNode(nodeId, data);
  }, [updateNode]);

  return (
    <div className={styles.container}>
      <NodeForm nodes={nodes} onAddNode={handleAddNode} />

      <div className={styles.main}>
        <div className={styles.toolbar}>
          <button
            onClick={() => onExecute({ nodes, edges })}
            className={styles.executeBtn}
            disabled={isRunning}
          >
            Execute Workflow
          </button>
          {isRunning && (
            <button onClick={onCancel} className={styles.cancelBtn}>
              Cancel Workflow
            </button>
          )}
        </div>

        <div className={styles.canvas}>
          <ReactFlow
            nodes={nodesWithStatus}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
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

      {selectedNode && (
        <NodeDetailPanel
          node={selectedNode}
          executionStatus={nodeStatuses[selectedNode.id]}
          onSave={handleNodeSave}
          onClose={() => setSelectedNodeId(null)}
        />
      )}
    </div>
  );
}

export default WorkflowCanvas;