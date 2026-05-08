import { useState, useRef, useCallback, useEffect } from 'react';
import { validateWorkflow } from '../utils/validateGraph';

const API_BASE = 'http://localhost:8080';

export default function useWorkflowExecution() {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [execResult, setExecResult] = useState(null);
  const [nodeStatuses, setNodeStatuses] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const execResultRef = useRef(null);
  const workflowIdRef = useRef(null);
  const wsRef = useRef(null);

  // Clean up WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const execute = async ({ nodes, edges }) => {
    setError('');
    setExecResult(null);
    setNodeStatuses({});
    setIsPaused(false);
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
        let msg = `HTTP error: ${response.status}`;
        try {
          const result = await response.json();
          msg = result.error || msg;
        } catch { /* non-JSON response */ }
        setError(msg);
        setStatus('');
        return;
      }

      const { workflow_id } = await response.json();
      workflowIdRef.current = workflow_id;
      setIsRunning(true);
      setStatus(`Workflow submitted (${workflow_id}). Connecting...`);

      // Close any prior WebSocket before opening a new one
      if (wsRef.current) {
        wsRef.current.close();
      }

      const ws = new WebSocket(`ws://${location.hostname}:8080/ws/${workflow_id}`);
      wsRef.current = ws;
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
          if (msg.log.status === 'paused') {
            setIsPaused(true);
            setStatus(`Workflow paused (${workflow_id})`);
          } else if (msg.log.status !== 'running') {
            const skip = msg.log.node_id === 'start' || msg.log.node_id === 'end' || msg.log.node_id === 'engine';
            if (!skip) {
              logs.push(msg.log);
              setStatus(`Running: ${msg.log.label} — ${msg.log.status} (${logs.length} tasks done)`);
            }
          }
        }

        if (msg.type === 'workflow_done') {
          setStatus('');
          setIsRunning(false);
          setIsPaused(false);
          workflowIdRef.current = null;
          wsRef.current = null;
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
        setIsPaused(false);
        wsRef.current = null;
      };

      ws.onclose = (event) => {
        if (!event.wasClean && !execResultRef.current) {
          setStatus('');
          setIsRunning(false);
          setIsPaused(false);
        }
        wsRef.current = null;
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

  const pause = useCallback(async () => {
    const id = workflowIdRef.current;
    if (!id) return;

    try {
      const res = await fetch(`${API_BASE}/pause/${id}`, { method: 'POST' });
      if (!res.ok) {
        setError('Failed to pause workflow.');
      }
    } catch (err) {
      console.error('Error pausing workflow:', err);
      setError('Failed to pause workflow.');
    }
  }, []);

  const resume = useCallback(async () => {
    const id = workflowIdRef.current;
    if (!id) return;

    try {
      const res = await fetch(`${API_BASE}/resume/${id}`, { method: 'POST' });
      if (res.ok) {
        setIsPaused(false);
        setStatus(`Running workflow (${id})...`);
      } else {
        setError('Failed to resume workflow.');
      }
    } catch (err) {
      console.error('Error resuming workflow:', err);
      setError('Failed to resume workflow.');
    }
  }, []);

  const abort = useCallback(async () => {
    const id = workflowIdRef.current;
    if (id) {
      try {
        await fetch(`${API_BASE}/cancel/${id}`, { method: 'POST' });
      } catch { /* best effort */ }
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    workflowIdRef.current = null;
    execResultRef.current = null;
    setStatus('');
    setError('');
    setExecResult(null);
    setNodeStatuses({});
    setIsRunning(false);
    setIsPaused(false);
  }, []);

  return {
    status,
    error,
    execResult,
    nodeStatuses,
    isRunning,
    isPaused,
    execute,
    cancel,
    pause,
    resume,
    abort,
    dismissError: () => setError(''),
    dismissResult: () => setExecResult(null),
    showResult: () => setExecResult(execResultRef.current),
    hasResult: !!execResultRef.current,
    resetStatuses: () => setNodeStatuses({}),
  };
}