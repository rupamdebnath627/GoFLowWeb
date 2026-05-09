import { Link, useLocation } from 'react-router-dom';
import styles from './styles/Navbar.module.css';

function Navbar() {
  const location = useLocation();

  return (
    <nav className={styles.navbar}>
      <Link to="/" className={styles.brand}>GoFlowWeb</Link>
      <div className={styles.links}>
        <Link
          to="/"
          className={`${styles.link} ${location.pathname === '/' ? styles.active : ''}`}
        >
          Home
        </Link>
        <Link
          to="/workflow"
          className={`${styles.link} ${location.pathname === '/workflow' ? styles.active : ''}`}
        >
          Workflow
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;