import { useMemo, useState, useCallback } from 'react';
import ReactFlow, { ConnectionLineType, Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import styles from './styles/WorkflowCanvas.module.css';
import NodeForm from './NodeForm';
import CustomNode from './CustomNode';
import ConfirmDialog from './ConfirmDialog';
import NodeDetailPanel from './NodeDetailPanel';

function WorkflowCanvas({ graph, onExecute, nodeStatuses }) {
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);
  const [selectedNode, setSelectedNode] = useState(null);

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

  const onNodeClick = useCallback((_event, node) => {
    setSelectedNode(node);
  }, []);

  const handleNodeSave = useCallback((nodeId, data) => {
    updateNode(nodeId, data);
  }, [updateNode]);

  return (
    <div className={styles.container}>
      <NodeForm nodes={nodes} onAddNode={handleAddNode} />

      <div className={styles.main}>
        <div className={styles.toolbar}>
          <button onClick={() => onExecute({ nodes, edges })} className={styles.executeBtn}>
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
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}

export default WorkflowCanvas;