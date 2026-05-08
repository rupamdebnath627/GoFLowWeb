import { useMemo } from 'react';
import ReactFlow, { ConnectionLineType, Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import styles from './styles/WorkflowCanvas.module.css';
import NodeForm from './NodeForm';
import CustomNode from './CustomNode';
import ConfirmDialog from './ConfirmDialog';

function WorkflowCanvas({ graph, onExecute }) {
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

  const {
    nodes,
    edges,
    pendingDelete,
    onNodesChange,
    onEdgesChange,
    onConnect,
    handleAddNode,
    handleConfirmDelete,
    handleCancelDelete,
  } = graph;

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