import { useEffect } from 'react';
import styles from './styles/SavedWorkflowsPanel.module.css';

function SavedWorkflowsPanel({ savedWorkflows, loading, activeWorkflowId, onFetch, onLoad, onDelete }) {
  useEffect(() => {
    onFetch();
  }, [onFetch]);

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>My Workflows</h3>
      {loading && <p className={styles.info}>Loading...</p>}
      {!loading && savedWorkflows.length === 0 && (
        <p className={styles.info}>No saved workflows</p>
      )}
      <div className={styles.list}>
        {savedWorkflows.map((w) => (
          <div
            key={w.id}
            className={`${styles.item} ${w.id === activeWorkflowId ? styles.active : ''}`}
          >
            <button className={styles.name} onClick={() => onLoad(w)}>
              {w.name}
            </button>
            <button className={styles.deleteBtn} onClick={() => onDelete(w.id)} title="Delete">
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SavedWorkflowsPanel;