import { useState } from 'react';
import styles from './styles/NodeDetailPanel.module.css';

const STATUS_CONFIG = {
  idle: { icon: '\u25CB', label: 'Not executed', className: 'statusIdle' },
  pending: { icon: '\u25CB', label: 'Pending', className: 'statusIdle' },
  running: { icon: '\u25F7', label: 'Running...', className: 'statusRunning' },
  completed: { icon: '\u2713', label: 'Completed', className: 'statusCompleted' },
  failed: { icon: '\u2717', label: 'Failed', className: 'statusFailed' },
  'failed (optional)': { icon: '\u26A0', label: 'Failed (optional)', className: 'statusFailed' },
  skipped: { icon: '\u2192', label: 'Skipped', className: 'statusSkipped' },
  error: { icon: '\u2717', label: 'Error', className: 'statusFailed' },
};

function NodeDetailPanel({ node, executionStatus, onSave, onClose }) {
  const isFixedNode = node.id === 'start' || node.id === 'end';
  const nodeStatus = executionStatus?.status || 'idle';
  const isEditable = (nodeStatus === 'idle' || nodeStatus === 'pending') && !isFixedNode;
  const statusInfo = STATUS_CONFIG[nodeStatus] || STATUS_CONFIG.idle;

  const [label, setLabel] = useState(node.data.label);
  const [command, setCommand] = useState(node.data.command || '');
  const [optional, setOptional] = useState(node.data.optional || false);

  const hasChanges =
    label !== node.data.label ||
    command !== (node.data.command || '') ||
    optional !== (node.data.optional || false);

  const handleSave = () => {
    if (!label.trim()) return;
    onSave(node.id, { label: label.trim(), command: command.trim(), optional });
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>{node.data.label}</h3>
            <span className={styles.nodeId}>{node.id}</span>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>&times;</button>
        </div>

        <div className={styles.statusSection}>
          <span className={styles.statusIcon}>{statusInfo.icon}</span>
          <span className={`${styles.statusText} ${styles[statusInfo.className]}`}>
            {statusInfo.label}
          </span>
        </div>

        {executionStatus?.output && (
          <div className={styles.outputSection}>
            <div className={styles.outputLabel}>Output</div>
            <pre className={styles.output}>{executionStatus.output}</pre>
          </div>
        )}

        {isFixedNode ? (
          <div className={styles.field}>
            <span className={styles.label}>Label</span>
            <div className={styles.readonlyValue}>{node.data.label}</div>
          </div>
        ) : (
          <>
            <div className={styles.field}>
              <label className={styles.label}>Label</label>
              <input
                className={styles.input}
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                disabled={!isEditable}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Command / Script</label>
              <textarea
                className={styles.textarea}
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                disabled={!isEditable}
                rows={4}
              />
            </div>

            <div className={styles.checkboxField}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={optional}
                  onChange={(e) => setOptional(e.target.checked)}
                  disabled={!isEditable}
                />
                Optional (continues on failure)
              </label>
            </div>

            {isEditable && hasChanges && (
              <div className={styles.actions}>
                <button onClick={onClose} className={styles.cancelBtn}>Cancel</button>
                <button onClick={handleSave} className={styles.saveBtn}>Save</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default NodeDetailPanel;