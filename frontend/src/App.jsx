import { useState } from 'react';
import WorkflowCanvas from './features/workflow/WorkflowCanvas';
import StatusBar from './features/workflow/StatusBar';
import ExecutionResult from './features/workflow/ExecutionResult';
import { validateWorkflow } from './features/workflow/validateGraph';

function App() {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [execResult, setExecResult] = useState(null);

  const handleValidation = ({ nodes, edges }) => {
    const errors = validateWorkflow(nodes, edges);
    setWarning(errors.length > 0 ? errors.join(' | ') : '');
  };

  const handleExecute = async ({ nodes, edges }) => {
    setError('');
    setExecResult(null);
    setStatus('Submitting workflow...');

    const errors = validateWorkflow(nodes, edges);
    if (errors.length > 0) {
      setError(errors.join(' | '));
      setStatus('');
      return;
    }

    const payload = {
      nodes: nodes.map(({ id, data }) => ({ id, data: { label: data.label, command: data.command || '', optional: data.optional || false } })),
      edges: edges.map(({ id, source, target }) => ({ id, source, target })),
    };

    try {
      const response = await fetch('http://localhost:8080/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const result = await response.json();
        setError(result.error || `HTTP error: ${response.status}`);
        setStatus('');
        return;
      }

      const { workflow_id } = await response.json();
      setStatus(`Workflow submitted (${workflow_id}). Connecting...`);

      const ws = new WebSocket(`ws://localhost:8080/ws/${workflow_id}`);
      const logs = [];

      ws.onopen = () => {
        setStatus(`Running workflow (${workflow_id})...`);
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        if (msg.type === 'task_update' && msg.log) {
          logs.push(msg.log);
          setStatus(`Running: ${msg.log.label} — ${msg.log.status} (${logs.length} tasks done)`);
        }

        if (msg.type === 'workflow_done') {
          setStatus('');
          setExecResult({
            status: msg.status,
            message: msg.message,
            logs: [...logs],
          });
          ws.close();
        }
      };

      ws.onerror = () => {
        setError('WebSocket connection failed.');
        setStatus('');
      };

      ws.onclose = (event) => {
        if (!event.wasClean && !execResult) {
          setStatus('');
        }
      };
    } catch (err) {
      console.error("Error executing workflow:", err);
      setError("Failed to connect to backend.");
      setStatus('');
    }
  };

  return (
    <>
      <WorkflowCanvas onExecute={handleExecute} onGraphChange={handleValidation} />
      <StatusBar error={error} warning={warning} status={status} onDismissError={() => setError('')} onDismissWarning={() => setWarning('')} />
      {execResult && (
        <ExecutionResult result={execResult} onClose={() => setExecResult(null)} />
      )}
    </>
  );
}

export default App;