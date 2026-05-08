import { useState } from 'react';
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
  const { status, error, execResult, nodeStatuses, isRunning, execute, cancel, dismissError, dismissResult } = useWorkflowExecution();

  return (
    <>
      <WorkflowCanvas graph={graph} onExecute={execute} onCancel={cancel} isRunning={isRunning} nodeStatuses={nodeStatuses} />
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