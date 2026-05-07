import { useState } from 'react';
import WorkflowCanvas from './features/workflow/WorkflowCanvas';
import StatusBar from './features/workflow/StatusBar';
import { validateWorkflow } from './features/workflow/validateGraph';

function App() {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  const handleValidation = ({ nodes, edges }) => {
    const errors = validateWorkflow(nodes, edges);
    setWarning(errors.length > 0 ? errors.join(' | ') : '');
  };

  const handleExecute = async ({ nodes, edges }) => {
    setError('');

    const errors = validateWorkflow(nodes, edges);
    if (errors.length > 0) {
      setError(errors.join(' | '));
      return;
    }

    const payload = {
      nodes: nodes.map(({ id, data }) => ({ id, data: { label: data.label, command: data.command || '' } })),
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
        return;
      }

      const result = await response.json();
      setStatus(result.message);
    } catch (err) {
      console.error("Error executing workflow:", err);
      setStatus("Failed to connect to backend.");
    }
  };

  return (
    <>
      <WorkflowCanvas onExecute={handleExecute} onGraphChange={handleValidation} />
      <StatusBar error={error} warning={warning} status={status} onDismissError={() => setError('')} onDismissWarning={() => setWarning('')} />
    </>
  );
}

export default App;