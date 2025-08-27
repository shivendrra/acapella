import React from 'react';
import './styles/Profile.css';
import ProfilePics from './media/pictures/ProfilePics.svg';

export default function Profile() {
  return (
    <div className="profileLander d-flex justify-content-center align-items-center">
      <div className="profile-card card p-4 shadow-sm">
        <h3 className="mb-4">My Profile</h3>

        <div className="profile-circle mx-auto mb-4">
          <img src={ProfilePics} alt="Profile" />
        </div>

        <hr />

        <div className="personal-section">
          <div className="row mb-3">
            <div className="col-md-6 col-sm-6 mb-3 mb-md-0">
              <label className="form-label text-mute">First Name</label>
              <p className="data-field">John</p>
            </div>
            <div className="col-md-6 col-sm-6">
              <label className="form-label text-mute">Last Name</label>
              <p className="data-field">Doe</p>
            </div>
          </div>
          <div className="row mb-3">
            <div className="col-md-6 mb-3 mb-md-0">
              <label className="form-label text-mute">Email</label>
              <p className="data-field">example@email.com</p>
            </div>
            <div className="col-md-6">
              <label className="form-label text-mute">Date of Birth</label>
              <p className="data-field">14/08/2005</p>
            </div>
          </div>
          <div className="row">
            <div className="col">
              <label className="form-label text-mute">Bio</label>
              <p className="data-field">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
            </div>
          </div>
        </div>
        <hr />
        <br />
        <div className="delete-section">
          <label className='form-label text-mute'>Delete My Account</label>
          <div className='col d-flex justify-content-between'>
            <p className='my-auto'>Do you want to delete your account?</p>
            <button className='btn btn-outline-danger btn-delete'>Proceed</button>
          </div>
        </div>
      </div>
    </div>
  );
}