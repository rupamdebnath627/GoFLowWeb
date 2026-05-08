import { useState, useRef, useCallback } from 'react';
import { validateWorkflow } from '../utils/validateGraph';

const API_BASE = 'http://localhost:8080';

export default function useWorkflowExecution() {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [execResult, setExecResult] = useState(null);
  const [nodeStatuses, setNodeStatuses] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const execResultRef = useRef(null);
  const workflowIdRef = useRef(null);

  const execute = async ({ nodes, edges }) => {
    setError('');
    setExecResult(null);
    setNodeStatuses({});
    execResultRef.current = null;
    workflowIdRef.current = null;
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
      const response = await fetch(`${API_BASE}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const result = await response.json();
        setError(result.error || `HTTP error: ${response.status}`);
        setStatus('');
        return;
      }

      const { workflow_id } = await response.json();
      workflowIdRef.current = workflow_id;
      setIsRunning(true);
      setStatus(`Workflow submitted (${workflow_id}). Connecting...`);

      const ws = new WebSocket(`ws://${location.hostname}:8080/ws/${workflow_id}`);
      const logs = [];

      ws.onopen = () => {
        const initial = {};
        for (const node of nodes) {
          if (node.id !== 'start' && node.id !== 'end') {
            initial[node.id] = { status: 'pending', output: '' };
          }
        }
        setNodeStatuses(initial);
        setStatus(`Running workflow (${workflow_id})...`);
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        if (msg.type === 'task_update' && msg.log) {
          setNodeStatuses((prev) => ({
            ...prev,
            [msg.log.node_id]: { status: msg.log.status, output: msg.log.output },
          }));
          if (msg.log.status !== 'running') {
            logs.push(msg.log);
            setStatus(`Running: ${msg.log.label} — ${msg.log.status} (${logs.length} tasks done)`);
          }
        }

        if (msg.type === 'workflow_done') {
          setStatus('');
          setIsRunning(false);
          workflowIdRef.current = null;
          const result = {
            status: msg.status,
            message: msg.message,
            logs: [...logs],
          };
          execResultRef.current = result;
          setExecResult(result);
          ws.close();
        }
      };

      ws.onerror = () => {
        setError('WebSocket connection failed.');
        setStatus('');
        setIsRunning(false);
      };

      ws.onclose = (event) => {
        if (!event.wasClean && !execResultRef.current) {
          setStatus('');
          setIsRunning(false);
        }
      };
    } catch (err) {
      console.error('Error executing workflow:', err);
      setError('Failed to connect to backend.');
      setStatus('');
      setIsRunning(false);
    }
  };

  const cancel = useCallback(async () => {
    const id = workflowIdRef.current;
    if (!id) return;

    try {
      const res = await fetch(`${API_BASE}/cancel/${id}`, { method: 'POST' });
      if (!res.ok) {
        setError('Failed to cancel workflow.');
      }
    } catch (err) {
      console.error('Error cancelling workflow:', err);
      setError('Failed to cancel workflow.');
    }
  }, []);

  return {
    status,
    error,
    execResult,
    nodeStatuses,
    isRunning,
    execute,
    cancel,
    dismissError: () => setError(''),
    dismissResult: () => setExecResult(null),
  };
}