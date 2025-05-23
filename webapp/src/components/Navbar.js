import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import "./styles/Navbar.css";

export default function Navbar() {
  const [showNav, setShowNav] = useState(true);
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/login' || location.pathname === '/signup') {
      setShowNav(false);
    } else {
      setShowNav(true);
    }
  }, [location.pathname]);
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
                <span class="material-symbols-outlined">
                  graphic_eq
                </span>
              </span>
              <h3 className='navbar-brand-title my-1 ms-2'>Acapella</h3>
            </Link>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
              <span class="material-symbols-outlined">
                menu
              </span>
            </button>
            <div className="collapse navbar-collapse" id="navbarSupportedContent">
              <ul className="navbar-nav ms-auto">
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
              </ul>
            </div>
          </div>
        </nav >
      </div >
    </>
  )
}