import styles from './styles/WorkflowCanvas.module.css';

function WorkflowToolbar({ onExecute, onCancel, onPause, onResume, isRunning, isPaused }) {
  return (
    <div className={styles.toolbar}>
      <button
        onClick={onExecute}
        className={styles.executeBtn}
        disabled={isRunning}
      >
        Execute Workflow
      </button>
      {isRunning && (
        <>
          {isPaused ? (
            <button onClick={onResume} className={styles.resumeBtn}>
              Resume Workflow
            </button>
          ) : (
            <button onClick={onPause} className={styles.pauseBtn}>
              Pause Workflow
            </button>
          )}
          <button onClick={onCancel} className={styles.cancelBtn}>
            Cancel Workflow
          </button>
        </>
      )}
    </div>
  );
}

export default WorkflowToolbar;