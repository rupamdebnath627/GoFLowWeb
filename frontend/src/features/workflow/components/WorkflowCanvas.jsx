import { useMemo, useState, useCallback } from 'react';
import ReactFlow, { ConnectionLineType, Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import styles from './styles/WorkflowCanvas.module.css';
import NodeForm from './NodeForm';
import CustomNode from './CustomNode';
import ConfirmDialog from './ConfirmDialog';
import NodeDetailPanel from './NodeDetailPanel';
import WorkflowToolbar from './WorkflowToolbar';
import SavedWorkflowsPanel from './SavedWorkflowsPanel';

function WorkflowCanvas({ graph, onExecute, onCancel, onPause, onResume, isRunning, isPaused, nodeStatuses, hasResult, onShowReport, onReset, onClear, onSave, onUpdate, activeWorkflowId, savedWorkflows, savedWorkflowsLoading, onFetchWorkflows, onLoadWorkflow, onDeleteWorkflow }) {
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  const {
    nodes,
    edges,
    pendingDelete,
    connectionError,
    onNodesChange,
    onEdgesChange,
    onConnect,
    handleAddNode,
    updateNode,
    handleConfirmDelete,
    handleCancelDelete,
    dismissConnectionError,
  } = graph;

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
      <SavedWorkflowsPanel
        savedWorkflows={savedWorkflows}
        loading={savedWorkflowsLoading}
        activeWorkflowId={activeWorkflowId}
        onFetch={onFetchWorkflows}
        onLoad={onLoadWorkflow}
        onDelete={onDeleteWorkflow}
      />
      <NodeForm nodes={nodes} onAddNode={handleAddNode} />

      <div className={styles.main}>
        <WorkflowToolbar
          onExecute={() => onExecute({ nodes, edges })}
          onCancel={onCancel}
          onPause={onPause}
          onResume={onResume}
          isRunning={isRunning}
          isPaused={isPaused}
          hasResult={hasResult}
          onShowReport={onShowReport}
          onReset={onReset}
          onClear={onClear}
          onSave={onSave}
          onUpdate={onUpdate}
          activeWorkflowId={activeWorkflowId}
        />

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
          {connectionError && (
            <div className={styles.connectionErrorToast}>
              {connectionError}
              <button className={styles.toastDismiss} onClick={dismissConnectionError}>×</button>
            </div>
          )}
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