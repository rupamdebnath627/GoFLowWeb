import { useState, useCallback } from 'react';
import WorkflowCanvas from './components/WorkflowCanvas';
import StatusBar from './components/StatusBar';
import ExecutionResult from './components/ExecutionResult';
import useWorkflowGraph from './hooks/useWorkflowGraph';
import useWorkflowExecution from './hooks/useWorkflowExecution';
import { validateWorkflow } from './utils/validateGraph';

function WorkflowPage() {
  const [warning, setWarning] = useState('');

  const handleGraphChange = ({ nodes, edges }) => {
    const errors = validateWorkflow(nodes, edges);
    setWarning(errors.length > 0 ? errors.join(' | ') : '');
  };

  const graph = useWorkflowGraph({ onGraphChange: handleGraphChange });
  const { status, error, execResult, nodeStatuses, isRunning, isPaused, execute, cancel, pause, resume, abort, dismissError, dismissResult, showResult, hasResult, resetStatuses } = useWorkflowExecution();

  const handleReset = useCallback(async () => {
    if (isRunning) await abort();
    else resetStatuses();
    graph.resetGraph();
  }, [isRunning, abort, resetStatuses, graph]);

  const handleClear = useCallback(async () => {
    if (isRunning) await abort();
    else resetStatuses();
    graph.clearGraph();
  }, [isRunning, abort, resetStatuses, graph]);

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