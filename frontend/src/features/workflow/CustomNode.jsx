import { Handle, Position } from 'reactflow';
import styles from './CustomNode.module.css';

function CustomNode({ data }) {
  return (
    <div className={styles.node}>
      {/* Target handles (incoming) — offset to the left / top */}
      <Handle type="target" position={Position.Top} id="target-top" style={{ left: '40%' }} />
      <Handle type="target" position={Position.Bottom} id="target-bottom" style={{ left: '40%' }} />
      <Handle type="target" position={Position.Left} id="target-left" style={{ top: '40%' }} />
      <Handle type="target" position={Position.Right} id="target-right" style={{ top: '40%' }} />
      <span>{data.label}</span>
      {/* Source handles (outgoing) — offset to the right / bottom */}
      <Handle type="source" position={Position.Top} id="source-top" style={{ left: '60%' }} />
      <Handle type="source" position={Position.Bottom} id="source-bottom" style={{ left: '60%' }} />
      <Handle type="source" position={Position.Left} id="source-left" style={{ top: '60%' }} />
      <Handle type="source" position={Position.Right} id="source-right" style={{ top: '60%' }} />
    </div>
  );
}

export default CustomNode;