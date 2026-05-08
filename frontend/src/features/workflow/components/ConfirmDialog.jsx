import styles from './styles/ConfirmDialog.module.css';

function ConfirmDialog({ message, warnings, onConfirm, onCancel }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <p className={styles.message}>{message}</p>
        <ul className={styles.warnings}>
          {warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
        <div className={styles.actions}>
          <button onClick={onCancel} className={styles.cancelBtn}>Cancel</button>
          <button onClick={onConfirm} className={styles.confirmBtn}>Delete Anyway</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;