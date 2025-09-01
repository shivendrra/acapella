import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import "./styles/Navbar.css";

export default function Navbar() {
  const [showNav, setShowNav] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    if (location.pathname === '/login' || location.pathname === '/signup') {
      setShowNav(false);
    } else {
      setShowNav(true);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!showNav) {
    return null;
  }

  return (
    <>
      <div className="navbar-section">
        <nav id="mainNavbar" className={`navbar navbar-expand-md fixed-top d-${showNav}`} style={{ display: `${showNav}` }}>
          <div className="container">
            <Link className="navbar-brand" to="/">
              <span className='navbar-brand-logo me-1 my-1'>
                <span className="material-symbols-outlined">
                  graphic_eq
                </span>
              </span>
              <h3 className='navbar-brand-title my-1 ms-2'>Acapella</h3>
            </Link>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
              <span className="material-symbols-outlined">
                menu
              </span>
            </button>
            <div className="collapse navbar-collapse" id="navbarSupportedContent">
              <ul className="navbar-nav ms-auto">
                {currentUser ? (
                  // Show these items when user is logged in
                  <>
                    <li className="nav-item">
                      <Link to="/music" className='nav-link'>
                        MUSIC
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link to="/curators" className='nav-link'>
                        CURATORS
                      </Link>
                    </li>
                    <li className="nav-item dropdown">
                      <a className="nav-link dropdown-toggle" href="/" role="button" data-bs-toggle="dropdown" aria-expanded="false"> {currentUser.displayName || currentUser.email} </a>
                      <ul className="dropdown-menu">
                        <li><Link className="dropdown-item" to="/profile">Profile</Link></li>
                        <li><Link className="dropdown-item" to="/user">User</Link></li>
                        <li><Link className="dropdown-item" to="/settings">Settings</Link></li>
                        <li><hr className="dropdown-divider" /></li>
                        <li><button className="dropdown-item" onClick={handleLogout}>Logout</button></li>
                      </ul>
                    </li>
                  </>
                ) : (
                  // Show these items when user is not logged in
                  <>
                    <li className="nav-item">
                      <Link to="/login" className='nav-link'>
                        LOG IN
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link to="/signup" className='nav-link'>
                        CREATE ACCOUNT
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link to="/music" className='nav-link'>
                        MUSIC
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link to="/curators" className='nav-link'>
                        CURATORS
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}