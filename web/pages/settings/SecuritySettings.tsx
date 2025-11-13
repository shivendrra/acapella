import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { auth } from '../../services/firebase';
import { sendPasswordResetEmail } from '@firebase/auth';

const SecuritySettings: React.FC = () => {
  const { currentUser } = useAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentUser?.email) {
      setError('No email address is associated with this account.');
      return;
    }
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await sendPasswordResetEmail(auth, currentUser.email);
      setMessage('Password reset link sent! Please check your email inbox.');
    } catch (err) {
      console.error("Error sending password reset email:", err);
      setError('Failed to send password reset email. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold font-serif mb-4">Security</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Manage your password and two-factor authentication.
      </p>
      <div className="space-y-6">
        <div className="p-6 border rounded-lg">
          <h3 className="text-lg font-semibold">Change Password</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1 mb-4 text-sm">
            We'll send a secure link to your email address to guide you through the process.
          </p>
          <button
            onClick={handleChangePassword}
            disabled={loading}
            className="px-5 py-2 bg-ac-primary text-white rounded-md hover:bg-ac-primary/90 disabled:bg-gray-400"
          >
            {loading ? 'Sending...' : 'Send Password Reset Link'}
          </button>
          {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
          {error && <p className="mt-4 text-sm text-ac-danger">{error}</p>}
        </div>
         <div className="p-4 border border-dashed rounded-md text-gray-500">
            <p>Two-factor authentication will be available here soon.</p>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
