import { useState } from 'react';
import styles from './NodeForm.module.css';

const NODE_TYPES = ['Task', 'Decision', 'Process', 'Action'];

function NodeForm({ nodes, onAddNode }) {
  const [label, setLabel] = useState('');
  const [type, setType] = useState(NODE_TYPES[0]);
  const [parentId, setParentId] = useState('');
  const [childId, setChildId] = useState('');
  const [error, setError] = useState('');

  const selectableNodes = nodes.filter((n) => n.id !== 'end');
  const childNodes = nodes.filter((n) => n.id !== 'start');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!label.trim()) {
      setError('Node label is required.');
      return;
    }
    if (!parentId || !childId) {
      setError('Please select both a parent and a child node.');
      return;
    }
    if (parentId === childId) {
      setError('Parent and child must be different nodes.');
      return;
    }
    setError('');
    onAddNode({ label: label.trim(), type, parentId, childId });
    setLabel('');
    setType(NODE_TYPES[0]);
    setParentId('');
    setChildId('');
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h3 className={styles.title}>Add Node</h3>

      <div className={styles.field}>
        <label className={styles.label}>Label</label>
        <input
          className={styles.input}
          type="text"
          placeholder="Node label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Type</label>
        <select
          className={styles.select}
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {NODE_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Insert After (Parent)</label>
        <select
          className={styles.select}
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
        >
          <option value="">-- Select parent --</option>
          {selectableNodes.map((n) => (
            <option key={n.id} value={n.id}>{n.data.label}</option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Insert Before (Child)</label>
        <select
          className={styles.select}
          value={childId}
          onChange={(e) => setChildId(e.target.value)}
        >
          <option value="">-- Select child --</option>
          {childNodes.map((n) => (
            <option key={n.id} value={n.id}>{n.data.label}</option>
          ))}
        </select>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button className={styles.submitBtn} type="submit">Add Node</button>
    </form>
  );
}

export default NodeForm;