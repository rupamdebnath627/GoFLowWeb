import styles from './styles/ExecutionResult.module.css';

const STATUS_ICONS = {
  completed: '\u2713',
  failed: '\u2717',
  'failed (optional)': '\u26A0',
  skipped: '\u2192',
  cancelled: '\u2715',
  error: '\u2717',
};

const TITLE_MAP = {
  success: { text: 'Workflow Completed', className: 'titleSuccess' },
  failed: { text: 'Workflow Failed', className: 'titleFailed' },
  cancelled: { text: 'Workflow Cancelled', className: 'titleCancelled' },
};

function ExecutionResult({ result, onClose }) {
  const titleInfo = TITLE_MAP[result.status] || TITLE_MAP.failed;

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h3 className={`${styles.title} ${styles[titleInfo.className]}`}>
            {titleInfo.text}
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
                <span className={`${styles.logStatus} ${log.status === 'completed' ? styles.statusOk : log.status === 'cancelled' ? styles.statusCancelled : styles.statusFail}`}>
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