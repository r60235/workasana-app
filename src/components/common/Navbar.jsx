import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  const isActive = (path) => {
    // Only check pathname, ignore query parameters
    return location.pathname === path ? 'active' : '';
  };

  const NavLinks = () => (
    <>
      <li className="nav-item">
        <Link 
          to="/"
          className={`nav-link d-flex align-items-center ${isActive('/')}`}
        >
          <i className="bi bi-house me-2"></i>
          Dashboard
        </Link>
      </li>
      
      <li className="nav-item">
        <Link 
          to="/projects"
          className={`nav-link d-flex align-items-center ${isActive('/projects')}`}
        >
          <i className="bi bi-folder me-2"></i>
          Projects
        </Link>
      </li>
      
      <li className="nav-item">
        <Link 
          to="/tasks"
          className={`nav-link d-flex align-items-center ${isActive('/tasks')}`}
        >
          <i className="bi bi-list-task me-2"></i>
          Tasks
        </Link>
      </li>
      
      <li className="nav-item">
        <Link 
          to="/teams"
          className={`nav-link d-flex align-items-center ${isActive('/teams')}`}
        >
          <i className="bi bi-people me-2"></i>
          Teams
        </Link>
      </li>
      
      <li className="nav-item">
        <Link 
          to="/reports"
          className={`nav-link d-flex align-items-center ${isActive('/reports')}`}
        >
          <i className="bi bi-bar-chart me-2"></i>
          Reports
        </Link>
      </li>
    </>
  );

  return (
    <>
      {/* desktop sidebar */}
      <div className="sidebar bg-white border-end d-none d-md-block">
        <div className="p-3">
          <Link to="/" className="text-decoration-none">
            <h4 className="text-primary mb-0">
              <i className="bi bi-check2-square me-2"></i>
              Workasana
            </h4>
          </Link>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav flex-column">
            <NavLinks />
          </ul>
        </nav>

        <div className="mt-auto p-3 border-top">
          <div className="d-flex align-items-center mb-2">
            <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-2" 
                 style={{ width: '32px', height: '32px' }}>
              <i className="bi bi-person text-white"></i>
            </div>
            <div className="flex-grow-1">
              <div className="fw-medium text-dark">{user?.name}</div>
              <div className="small text-muted">{user?.email}</div>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="btn btn-outline-secondary btn-sm w-100"
          >
            <i className="bi bi-box-arrow-right me-2"></i>
            Logout
          </button>
        </div>
      </div>

      {/* mobile top navbar */}
      <nav className="top-navbar d-md-none">
        <div className="d-flex justify-content-between align-items-center">
          <Link to="/" className="text-decoration-none">
            <h5 className="text-primary mb-0">
              <i className="bi bi-check2-square me-2"></i>
              Workasana
            </h5>
          </Link>
          
          <div className="dropdown">
            <button 
              className="btn btn-outline-secondary btn-sm dropdown-toggle" 
              type="button" 
              data-bs-toggle="dropdown"
            >
              <i className="bi bi-person me-1"></i>
              {user?.name}
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
              <li><span className="dropdown-item-text small text-muted">{user?.email}</span></li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button className="dropdown-item" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-2"></i>
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-2">
          <ul className="nav nav-pills nav-fill">
            <li className="nav-item">
              <Link 
                to="/"
                className={`nav-link ${isActive('/')}`}
              >
                <i className="bi bi-house"></i>
                <span className="d-none d-sm-inline ms-1">Dashboard</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/projects"
                className={`nav-link ${isActive('/projects')}`}
              >
                <i className="bi bi-folder"></i>
                <span className="d-none d-sm-inline ms-1">Projects</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/tasks"
                className={`nav-link ${isActive('/tasks')}`}
              >
                <i className="bi bi-list-task"></i>
                <span className="d-none d-sm-inline ms-1">Tasks</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/teams"
                className={`nav-link ${isActive('/teams')}`}
              >
                <i className="bi bi-people"></i>
                <span className="d-none d-sm-inline ms-1">Teams</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/reports"
                className={`nav-link ${isActive('/reports')}`}
              >
                <i className="bi bi-bar-chart"></i>
                <span className="d-none d-sm-inline ms-1">Reports</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
};

export default Navbar;