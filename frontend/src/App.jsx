import { useState } from 'react';
import WorkflowCanvas from './features/workflow/WorkflowCanvas';
import StatusBar from './features/workflow/StatusBar';
import { findCycle } from './features/workflow/findCycle';

function App() {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleExecute = async ({ nodes, edges }) => {
    setError('');

    const cycle = findCycle(nodes, edges);
    if (cycle) {
      setError(`Circular dependency detected: ${cycle.join(' → ')}`);
      return;
    }

    const payload = {
      nodes: nodes.map(({ id, data }) => ({ id, data: { label: data.label } })),
      edges: edges.map(({ id, source, target }) => ({ id, source, target })),
    };

    try {
      const response = await fetch('http://localhost:8080/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
      <WorkflowCanvas onExecute={handleExecute} />
      <StatusBar error={error} status={status} onDismissError={() => setError('')} />
    </>
  );
}

export default App;