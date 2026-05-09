import { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';

const API_BASE = 'http://localhost:8080';

export default function useSavedWorkflows() {
  const [savedWorkflows, setSavedWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);
  const user = useSelector((state) => state.user.user);

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    'X-User-ID': String(user?.id || ''),
  }), [user]);

  const fetchWorkflows = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/workflows`, { headers: headers() });
      if (res.ok) {
        setSavedWorkflows(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch workflows:', err);
    } finally {
      setLoading(false);
    }
  }, [headers, user]);

  const saveWorkflow = useCallback(async (name, nodes, edges) => {
    if (!user?.id) throw new Error('Not logged in');
    try {
      const res = await fetch(`${API_BASE}/workflows`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ name, nodes, edges }),
      });
      if (res.ok) {
        const saved = await res.json();
        setSavedWorkflows((prev) => [saved, ...prev]);
        return saved;
      }
      const err = await res.json();
      throw new Error(err.error || 'Failed to save');
    } catch (err) {
      console.error('Failed to save workflow:', err);
      throw err;
    }
  }, [headers]);

  const updateWorkflow = useCallback(async (id, name, nodes, edges) => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_BASE}/workflows/${id}`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({ name, nodes, edges }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSavedWorkflows((prev) => prev.map((w) => (w.id === id ? updated : w)));
        return updated;
      }
    } catch (err) {
      console.error('Failed to update workflow:', err);
    }
  }, [headers]);

  const deleteWorkflow = useCallback(async (id) => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_BASE}/workflows/${id}`, {
        method: 'DELETE',
        headers: headers(),
      });
      if (res.ok) {
        setSavedWorkflows((prev) => prev.filter((w) => w.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete workflow:', err);
    }
  }, [headers]);

  return {
    savedWorkflows,
    loading,
    fetchWorkflows,
    saveWorkflow,
    updateWorkflow,
    deleteWorkflow,
  };
}