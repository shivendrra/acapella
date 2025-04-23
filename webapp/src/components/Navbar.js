import React from 'react';
import { Link } from 'react-router-dom';
import "./Navbar.css";

import mainLogo from './media/icons/logo192.png';

export default function Navbar() {
  return (
    <>
      <div className="navbar-section">
        <nav id="mainNavbar" className="navbar navbar-expand-md fixed-top">
          <div className="container">
            <Link className="navbar-brand" to="/">
              <span className='navbar-brand-logo me-1 my-1'>
                <img src={mainLogo} alt="Acapella Logo" />
              </span>
              <h3 className='navbar-brand-title my-1 ms-2'>Acapella</h3>
            </Link>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarSupportedContent">
              <ul className="navbar-nav ms-auto">
                <li className="nav-item">
                  <a className="nav-link" href="/login">LOG IN</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="/signup">CREATE ACCOUNT</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="/music">MUSIC</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="/curators">CURATORS</a>
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </div>
    </>
  )
}