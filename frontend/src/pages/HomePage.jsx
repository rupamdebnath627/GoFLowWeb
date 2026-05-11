import { Link } from 'react-router-dom';
import styles from './styles/HomePage.module.css';

function HomePage() {
  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>GoFlow</h1>
        <p className={styles.subtitle}>
          Visual workflow orchestration — design DAG-based workflows and execute them as shell commands with real-time status streaming.
        </p>
        <Link to="/workflow" className={styles.cta}>
          Open Workflow Editor
        </Link>
      </div>

      <div className={styles.features}>
        <div className={styles.feature}>
          <h3>Visual DAG Editor</h3>
          <p>Drag-and-drop node editor to design your workflow graph with dependencies.</p>
        </div>
        <div className={styles.feature}>
          <h3>Real-time Execution</h3>
          <p>Execute workflows and watch task progress stream live via WebSocket.</p>
        </div>
        <div className={styles.feature}>
          <h3>Pause & Resume</h3>
          <p>Pause running workflows, inspect state, and resume when ready.</p>
        </div>
      </div>
    </div>
  );
}

export default HomePage;