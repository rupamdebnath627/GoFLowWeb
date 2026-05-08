import styles from './styles/ExecutionResult.module.css';

const STATUS_ICONS = {
  completed: '\u2713',
  failed: '\u2717',
  'failed (optional)': '\u26A0',
  skipped: '\u2192',
  error: '\u2717',
};

function ExecutionResult({ result, onClose }) {
  const isFailed = result.status === 'failed';

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h3 className={`${styles.title} ${isFailed ? styles.titleFailed : styles.titleSuccess}`}>
            {isFailed ? 'Workflow Failed' : 'Workflow Completed'}
          </h3>
          <button onClick={onClose} className={styles.closeBtn}>&times;</button>
        </div>

        <p className={styles.message}>{result.message}</p>

        <div className={styles.logs}>
          {result.logs.map((log, i) => (
            <div key={i} className={`${styles.logEntry} ${styles[`log_${log.status.replace(/[^a-z]/g, '_')}`] || ''}`}>
              <div className={styles.logHeader}>
                <span className={styles.logIcon}>{STATUS_ICONS[log.status] || '?'}</span>
                <span className={styles.logLabel}>{log.label}</span>
                <span className={`${styles.logStatus} ${log.status === 'completed' ? styles.statusOk : styles.statusFail}`}>
                  {log.status}
                </span>
              </div>
              {log.output && (
                <pre className={styles.logOutput}>{log.output}</pre>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ExecutionResult;