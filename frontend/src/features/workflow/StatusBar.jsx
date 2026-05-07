import styles from './StatusBar.module.css';

function StatusBar({ error, status, onDismissError }) {
  return (
    <>
      {error && (
        <div className={styles.error}>
          <span>{error}</span>
          <button onClick={onDismissError} className={styles.closeBtn}>&times;</button>
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