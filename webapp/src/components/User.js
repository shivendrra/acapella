import React, { useState, useContext } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LoadingContext } from '../contexts/AppLoadingContext';
import { updateProfile, updatePassword, deleteUser } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './styles/User.css';
import ProfilePics from './media/pictures/ProfilePics.svg';

export default function User() {
  const { currentUser, logout } = useAuth();
  const { setLoading } = useContext(LoadingContext);
  const navigate = useNavigate();

  // State for editing mode
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form states
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [bio, setBio] = useState(''); // You can store this in Firestore later
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Error handling
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Parse display name into first and last name
  const getFirstName = () => {
    return displayName?.split(' ')[0] || '';
  };

  const getLastName = () => {
    return displayName?.split(' ').slice(1).join(' ') || '';
  };

  // Handle profile update
  const handleSaveProfile = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateProfile(currentUser, {
        displayName: displayName.trim()
      });

      setSuccess('Profile updated successfully!');
      setIsEditing(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to update profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await updatePassword(currentUser, newPassword);
      setSuccess('Password updated successfully!');
      setShowPasswordChange(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to update password: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    setLoading(true);
    setError('');

    try {
      await deleteUser(currentUser);
      await logout();
      navigate('/login');
    } catch (error) {
      setError('Failed to delete account: ' + error.message);
      setLoading(false);
    }
  };

  // Get user creation date
  const getJoinDate = () => {
    if (currentUser?.metadata?.creationTime) {
      return new Date(currentUser.metadata.creationTime).toLocaleDateString();
    }
    return 'Not available';
  };

  return (
    <div className="userLander d-flex justify-content-center align-items-center">
      <div className="user-card card p-4 shadow-sm">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="mb-0">User Settings</h3>
          {!isEditing && (
            <button className="btn btn-outline-primary btn-sm" onClick={() => setIsEditing(true)} >
              <i className="material-symbols-outlined me-1" style={{ fontSize: '16px' }}>edit</i>
              Edit Profile
            </button>
          )}
        </div>

        {/* Profile Picture */}
        <div className="user-circle mx-auto mb-4">
          {currentUser?.photoURL ? (
            <img src={currentUser.photoURL} alt="Profile" />
          ) : (
            <img src={ProfilePics} alt="Profile" />
          )}
        </div>

        {/* Success/Error Messages */}
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success" role="alert">
            {success}
          </div>
        )}

        <hr />

        {/* Personal Information Section */}
        <div className="personal-section">
          {isEditing ? (
            // Edit Mode
            <>
              <div className="row mb-3">
                <div className="col-md-6 col-sm-6 mb-3 mb-md-0">
                  <label className="form-label text-muted">First Name</label>
                  <input type="text" className="form-control" value={getFirstName()}
                    onChange={(e) => {
                      const lastName = getLastName();
                      setDisplayName(`${e.target.value} ${lastName}`.trim());
                    }} placeholder="First Name" />
                </div>
                <div className="col-md-6 col-sm-6">
                  <label className="form-label text-muted">Last Name</label>
                  <input type="text" className="form-control" value={getLastName()}
                    onChange={(e) => {
                      const firstName = getFirstName();
                      setDisplayName(`${firstName} ${e.target.value}`.trim());
                    }} placeholder="Last Name" />
                </div>
              </div>
              <div className="row mb-3">
                <div className="col">
                  <label className="form-label text-muted">Bio</label>
                  <textarea className="form-control" rows="3" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..."/>
                </div>
              </div>
              <div className="d-flex gap-2 mb-3">
                <button className="btn btn-success" onClick={handleSaveProfile}>Save Changes</button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsEditing(false);
                    setDisplayName(currentUser?.displayName || '');
                    setError('');
                  }}
                >Cancel</button>
              </div>
            </>
          ) : (
            // View Mode
            <>
              <div className="row mb-3">
                <div className="col-md-6 col-sm-6 mb-3 mb-md-0">
                  <label className="form-label text-muted">First Name</label>
                  <p className="data-field">{getFirstName() || 'Not provided'}</p>
                </div>
                <div className="col-md-6 col-sm-6">
                  <label className="form-label text-muted">Last Name</label>
                  <p className="data-field">{getLastName() || 'Not provided'}</p>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6 mb-3 mb-md-0">
                  <label className="form-label text-muted">Email</label>
                  <p className="data-field">{currentUser?.email}</p>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted">Member Since</label>
                  <p className="data-field">{getJoinDate()}</p>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6 mb-3 mb-md-0">
                  <label className="form-label text-muted">Account Type</label>
                  <p className="data-field">
                    {currentUser?.providerData?.[0]?.providerId === 'google.com' ? 'Google Account' : 'Email Account'}
                  </p>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted">Email Verified</label>
                  <p className="data-field">
                    {currentUser?.emailVerified ? (
                      <span className="text-success">✓ Verified</span>
                    ) : (
                      <span className="text-warning">⚠ Not Verified</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="row">
                <div className="col">
                  <label className="form-label text-muted">Bio</label>
                  <p className="data-field">{bio || 'No bio added yet.'}</p>
                </div>
              </div>
            </>
          )}
        </div>

        <hr />

        {/* Password Change Section */}
        {currentUser?.providerData?.[0]?.providerId !== 'google.com' && (
          <>
            <div className="password-section mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <label className="form-label text-muted mb-0">Change Password</label>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                >
                  {showPasswordChange ? 'Cancel' : 'Change Password'}
                </button>
              </div>

              {showPasswordChange && (
                <div className="password-change-form">
                  <div className="mb-3">
                    <input type="password" className="form-control" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  </div>
                  <div className="mb-3">
                    <input type="password" className="form-control" placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </div>
                  <button className="btn btn-primary" onClick={handlePasswordChange} disabled={!newPassword || !confirmPassword}>Update Password</button>
                </div>
              )}
            </div>
            <hr />
          </>
        )}

        {/* Delete Account Section */}
        <div className="delete-section">
          <label className="form-label text-muted">Delete My Account</label>
          <div className="col d-flex justify-content-between align-items-center">
            <div>
              <p className="mb-1">Do you want to delete your account?</p>
              <small className="text-muted">This action cannot be undone.</small>
            </div>
            {!showDeleteConfirm ? (
              <button className="btn btn-outline-danger btn-delete" onClick={() => setShowDeleteConfirm(true)} >Delete Account</button>
            ) : (
              <div className="d-flex flex-column gap-2">
                <small className="text-danger">Are you sure?</small>
                <div className="d-flex gap-2">
                  <button className="btn btn-danger btn-sm" onClick={handleDeleteAccount}>Yes, Delete
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}