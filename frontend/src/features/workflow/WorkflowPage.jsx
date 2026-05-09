import { useState, useCallback } from 'react';
import WorkflowCanvas from './components/WorkflowCanvas';
import StatusBar from './components/StatusBar';
import ExecutionResult from './components/ExecutionResult';
import useWorkflowGraph from './hooks/useWorkflowGraph';
import useWorkflowExecution from './hooks/useWorkflowExecution';
import useSavedWorkflows from './hooks/useSavedWorkflows';
import { validateWorkflow } from './utils/validateGraph';

function WorkflowPage() {
  const [warning, setWarning] = useState('');
  const [activeWorkflowId, setActiveWorkflowId] = useState(null);
  const [activeWorkflowName, setActiveWorkflowName] = useState('');

  const handleGraphChange = ({ nodes, edges }) => {
    const errors = validateWorkflow(nodes, edges);
    setWarning(errors.length > 0 ? errors.join(' | ') : '');
  };

  const graph = useWorkflowGraph({ onGraphChange: handleGraphChange });
  const { status, error, execResult, nodeStatuses, isRunning, isPaused, execute, cancel, pause, resume, abort, dismissError, dismissResult, showResult, hasResult, resetStatuses } = useWorkflowExecution();
  const { savedWorkflows, loading: savedWorkflowsLoading, fetchWorkflows, saveWorkflow, updateWorkflow, deleteWorkflow } = useSavedWorkflows();

  const handleReset = useCallback(async () => {
    if (isRunning) await abort();
    else resetStatuses();
    graph.resetGraph();
  }, [isRunning, abort, resetStatuses, graph]);

  const handleClear = useCallback(async () => {
    if (isRunning) await abort();
    else resetStatuses();
    graph.clearGraph();
    setActiveWorkflowId(null);
    setActiveWorkflowName('');
  }, [isRunning, abort, resetStatuses, graph]);

  const handleSave = useCallback(async () => {
    const name = prompt('Workflow name:', activeWorkflowName || '');
    if (!name) return;
    try {
      const saved = await saveWorkflow(name, graph.nodes, graph.edges);
      setActiveWorkflowId(saved.id);
      setActiveWorkflowName(saved.name);
    } catch {
      // error logged in hook
    }
  }, [saveWorkflow, graph.nodes, graph.edges, activeWorkflowName]);

  const handleUpdate = useCallback(async () => {
    if (!activeWorkflowId) return;
    await updateWorkflow(activeWorkflowId, activeWorkflowName, graph.nodes, graph.edges);
  }, [updateWorkflow, activeWorkflowId, activeWorkflowName, graph.nodes, graph.edges]);

  const handleLoadWorkflow = useCallback((workflow) => {
    if (isRunning) return;
    resetStatuses();
    graph.loadGraph(workflow.nodes, workflow.edges);
    setActiveWorkflowId(workflow.id);
    setActiveWorkflowName(workflow.name);
  }, [isRunning, resetStatuses, graph]);

  const handleDeleteWorkflow = useCallback(async (id) => {
    await deleteWorkflow(id);
    if (id === activeWorkflowId) {
      setActiveWorkflowId(null);
      setActiveWorkflowName('');
    }
  }, [deleteWorkflow, activeWorkflowId]);

  return (
    <>
      <WorkflowCanvas
        graph={graph}
        onExecute={execute}
        onCancel={cancel}
        onPause={pause}
        onResume={resume}
        isRunning={isRunning}
        isPaused={isPaused}
        nodeStatuses={nodeStatuses}
        hasResult={hasResult}
        onShowReport={showResult}
        onReset={handleReset}
        onClear={handleClear}
        onSave={handleSave}
        onUpdate={handleUpdate}
        activeWorkflowId={activeWorkflowId}
        savedWorkflows={savedWorkflows}
        savedWorkflowsLoading={savedWorkflowsLoading}
        onFetchWorkflows={fetchWorkflows}
        onLoadWorkflow={handleLoadWorkflow}
        onDeleteWorkflow={handleDeleteWorkflow}
      />
      <StatusBar
        error={error}
        warning={warning}
        status={status}
        onDismissError={dismissError}
        onDismissWarning={() => setWarning('')}
      />
      {execResult && (
        <ExecutionResult result={execResult} onClose={dismissResult} />
      )}
    </>
  );
}

export default WorkflowPage;