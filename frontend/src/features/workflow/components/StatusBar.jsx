import styles from './styles/StatusBar.module.css';

function StatusBar({ error, warning, status, onDismissError, onDismissWarning }) {
  return (
    <>
      {error && (
        <div className={styles.error}>
          <span>{error}</span>
          <button onClick={onDismissError} className={styles.closeBtn}>&times;</button>
        </div>
      )}
      {!error && warning && (
        <div className={styles.warning}>
          <span>{warning}</span>
          <button onClick={onDismissWarning} className={styles.closeBtn}>&times;</button>
        </div>
      )}
      {status && (
        <div className={styles.status}>
          {status}
        </div>
      )}
    </>
  );
}

export default StatusBar;