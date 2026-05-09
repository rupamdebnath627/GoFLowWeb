import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/userSlice';
import styles from './styles/Navbar.module.css';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

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
        {user && (
          <Link
            to="/workflow"
            className={`${styles.link} ${location.pathname === '/workflow' ? styles.active : ''}`}
          >
            Workflow
          </Link>
        )}
      </div>
      <div className={styles.auth}>
        {user ? (
          <>
            <span className={styles.username}>{user.username}</span>
            <button onClick={handleLogout} className={styles.logoutBtn}>Logout</button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className={`${styles.link} ${location.pathname === '/login' ? styles.active : ''}`}
            >
              Login
            </Link>
            <Link
              to="/signup"
              className={`${styles.link} ${location.pathname === '/signup' ? styles.active : ''}`}
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;