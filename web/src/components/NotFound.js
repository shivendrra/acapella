import React from 'react'
import donotexist from '../assets/svg/donotexist.svg';
import './styles/NotFound.css';

export default function NotFound() {
  return (
    <>
      <div className="container d-flex align-items-center justify-content-center min-vh-100">
        <div className="row justify-content-center">
          <div className="col-lg-12 col-md-8 col-lg-6 text-center">
            <div className="mb-4">
              <img src={donotexist} alt="Page not found" className="img-fluid not-found-image" onError={(e) => { e.target.style.display = 'none'; }} />
            </div>
            <h2 className="display-5 fw-semibold mb-3">Page Not Found</h2>
            <p className="lead text-muted">The page you're looking for doesn't exist or is temporarily unavailable.</p>
            <div className="mt-4">
              <button className="btn btn-outline-dark go-back" onClick={() => window.history.back()}>
                <span class="material-symbols-outlined">
                  arrow_back
                </span>
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}