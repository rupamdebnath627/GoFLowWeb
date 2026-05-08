import { Handle, Position } from 'reactflow';
import { STATUS_CLASS, STATUS_ICON } from '../constants/statusConfig';
import styles from './styles/CustomNode.module.css';

function CustomNode({ data }) {
  const execStatus = data.execStatus;
  const statusClass = execStatus ? styles[STATUS_CLASS[execStatus]] || '' : '';

  return (
    <div className={`${styles.node} ${data.optional ? styles.optional : ''} ${statusClass}`}>
      <Handle type="target" position={Position.Top} id="target-top" className={styles.targetHandle} style={{ left: '35%' }} />
      <Handle type="target" position={Position.Bottom} id="target-bottom" className={styles.targetHandle} style={{ left: '35%' }} />
      <Handle type="target" position={Position.Left} id="target-left" className={styles.targetHandle} style={{ top: '25%' }} />
      <Handle type="target" position={Position.Right} id="target-right" className={styles.targetHandle} style={{ top: '25%' }} />

      <div className={styles.labelRow}>
        {execStatus && (
          <span className={styles.statusIcon}>{STATUS_ICON[execStatus]}</span>
        )}
        <span>{data.label}</span>
        {data.optional && <span className={styles.badge}>optional</span>}
      </div>

      {data.command && (
        <div className={styles.command} title={data.command}>
          {data.command.length > 30 ? data.command.slice(0, 30) + '...' : data.command}
        </div>
      )}

      {execStatus && (
        <div className={styles.statusLabel}>{execStatus}</div>
      )}

      <Handle type="source" position={Position.Top} id="source-top" className={styles.sourceHandle} style={{ left: '65%' }} />
      <Handle type="source" position={Position.Bottom} id="source-bottom" className={styles.sourceHandle} style={{ left: '65%' }} />
      <Handle type="source" position={Position.Left} id="source-left" className={styles.sourceHandle} style={{ top: '75%' }} />
      <Handle type="source" position={Position.Right} id="source-right" className={styles.sourceHandle} style={{ top: '75%' }} />
    </div>
  );
}

export default CustomNode;