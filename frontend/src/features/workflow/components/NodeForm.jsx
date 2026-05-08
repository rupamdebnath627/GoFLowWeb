import { useState } from 'react';
import styles from './styles/NodeForm.module.css';

const NODE_TYPES = ['Task', 'Decision'];

function NodeForm({ nodes, onAddNode }) {
  const [label, setLabel] = useState('');
  const [type, setType] = useState(NODE_TYPES[0]);
  const [parentId, setParentId] = useState('');
  const [childId, setChildId] = useState('');
  const [command, setCommand] = useState('');
  const [optional, setOptional] = useState(false);
  const [error, setError] = useState('');

  const selectableNodes = nodes.filter((n) => n.id !== 'end');
  const childNodes = nodes.filter((n) => n.id !== 'start');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => setCommand(evt.target.result);
    reader.readAsText(file);
    e.target.value = '';
  };

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
    if (!command.trim()) {
      setError('Command / script is required.');
      return;
    }
    setError('');
    onAddNode({ label: label.trim(), type, parentId, childId, command: command.trim(), optional });
    setLabel('');
    setType(NODE_TYPES[0]);
    setParentId('');
    setChildId('');
    setCommand('');
    setOptional(false);
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

      <div className={styles.field}>
        <label className={styles.label}>Command / Script</label>
        <textarea
          className={styles.textarea}
          placeholder="echo 'hello world'"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          rows={4}
        />
        <label className={styles.fileLabel}>
          Upload .sh file
          <input type="file" accept=".sh,.bash,.txt" onChange={handleFileUpload} hidden />
        </label>
      </div>

      <div className={styles.checkboxField}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={optional}
            onChange={(e) => setOptional(e.target.checked)}
          />
          Optional (continues on failure)
        </label>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button className={styles.submitBtn} type="submit">Add Node</button>
    </form>
  );
}

export default NodeForm;