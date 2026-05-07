import { Handle, Position } from 'reactflow';
import styles from './CustomNode.module.css';

function CustomNode({ data }) {
  return (
    <div className={styles.node}>
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="source" position={Position.Right} id="right" />
      <span>{data.label}</span>
      <Handle type="source" position={Position.Left} id="left" className={styles.hiddenHandle} />
      <Handle type="target" position={Position.Right} id="right" className={styles.hiddenHandle} />
    </div>
  );
}

export default CustomNode;