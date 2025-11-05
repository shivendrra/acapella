import React, { useState, useContext } from "react";
import { useAuth } from "../contexts/AuthContext";
import { LoadingContext } from "../contexts/AppLoadingContext";
import { Navigate, Link } from "react-router-dom";
import "./styles/Signup.css";

// assets
import signup from "../assets/svg/UserSignup.svg";

export default function Signup() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signup: createAccount, loginWithGoogle, currentUser, error } = useAuth();
  const { setLoading } = useContext(LoadingContext);

  // Redirect if already logged in
  if (currentUser) {
    return <Navigate to="/home" />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const displayName = `${firstName} ${lastName}`.trim();
      await createAccount(email, password, displayName);
      // Navigation will happen automatically via AuthContext
    } catch (error) {
      console.error('Signup failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Google signup failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="signupLander">
        <div className="row gx-0 align-items-center w-100">
          <div className="col-lg-6 d-none d-md-flex info-side">
            <img src={signup} alt="Signing In" className="welcome-img" />
          </div>
          <div className="col-lg-6 col-md-12 form-side">
            <h3>Create A New Account</h3>
            <br />
            
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            
            <br />
            <button 
              className="btn btn-outline-danger mx-auto signup-with-google"
              onClick={handleGoogleSignup}
            >
              <span className="px-5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512" style={{ height: "28px", padding: "0px 10px", margin: "auto" }}>
                  <path fill="#be3d2a" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
                </svg>
                Signup with Google
              </span>
            </button>
            <br />
            <hr style={{ width: "60%", margin: "20px auto" }} />
            <br />
            <form className="row mx-auto" style={{ width: "100%" }} onSubmit={handleSubmit}>
              <div className="mb-3" style={{ width: "50%" }}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="First Name" 
                  aria-label="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3" style={{ width: "50%" }}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Last Name" 
                  aria-label="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="yourmail@example.com" 
                  aria-label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <input 
                  type="password" 
                  className="form-control" 
                  placeholder="Password" 
                  aria-describedby="passwordHelp"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength="6"
                />
                <small className="text-muted" style={{ marginTop: "4px", opacity: 0.8 }}>
                  Use 8-16 characters with at least one symbol for strong security.
                </small>
              </div>
              <button 
                className="btn btn-outline-info submit-button w-100"
                type="submit"
              >
                Create New Account
              </button>
            </form>
            <br />
            <p className="text-center">
              Already have an account? <Link to="/login" className="text-decoration-none">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}