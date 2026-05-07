import { useState } from 'react';
import WorkflowCanvas from './features/workflow/WorkflowCanvas';

function App() {
  const [status, setStatus] = useState('');

  const handleExecute = async ({ nodes, edges }) => {
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
      {status && (
        <div style={{ position: 'fixed', bottom: '16px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#282c34', color: 'white', padding: '8px 16px', borderRadius: '4px' }}>
          {status}
        </div>
      )}
    </>
  );
}

export default App;