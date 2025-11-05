
import React, { useState, useEffect } from 'react';
// Fix: Corrected import for useAuth from hooks directory
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export const AdminApplicationPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'submitted' | 'error' | 'already_applied'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkExistingApplication = async () => {
      if (!userProfile) return;
      const q = query(collection(db, "adminApplications"), where("userId", "==", userProfile.uid));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setStatus('already_applied');
      }
    };
    checkExistingApplication();
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || reason.trim().length < 50) {
      setErrorMessage('Please provide a detailed reason (at least 50 characters).');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    try {
      await addDoc(collection(db, 'adminApplications'), {
        userId: userProfile.uid,
        userEmail: userProfile.email,
        userName: userProfile.displayName,
        reason: reason.trim(),
        status: 'pending',
        submittedAt: serverTimestamp(),
      });
      setStatus('submitted');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMessage('Failed to submit application. Please try again later.');
    }
  };

  if (status === 'already_applied') {
    return (
        <div className="max-w-2xl mx-auto text-center py-20">
            <h1 className="text-4xl font-bold font-serif mb-4">Application Submitted</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
                Thank you. You have already submitted an application to become an admin. Our team will review it and get back to you.
            </p>
        </div>
    );
  }

  if (status === 'submitted') {
    return (
        <div className="max-w-2xl mx-auto text-center py-20">
            <h1 className="text-4xl font-bold font-serif mb-4">Application Received!</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
                Thank you for your interest in contributing to Acapella. We'll review your application and be in touch.
            </p>
            <button onClick={() => navigate('/')} className="mt-8 px-6 py-2 bg-ac-primary text-white rounded-md hover:bg-ac-primary/90">
                Back to Home
            </button>
        </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold font-serif mb-2">Become an Admin</h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
        Help us build the most comprehensive music database. Admins can add and edit artists, albums, and songs.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Why do you want to be an admin?
          </label>
          <div className="mt-1">
            <textarea
              id="reason"
              name="reason"
              rows={6}
              className="shadow-sm focus:ring-ac-accent focus:border-ac-accent block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              placeholder="Tell us about your passion for music and why you'd be a great contributor..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              minLength={50}
              required
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">Please be descriptive (min. 50 characters).</p>
        </div>

        {errorMessage && <p className="text-sm text-ac-danger">{errorMessage}</p>}

        <div>
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-ac-primary hover:bg-ac-primary/90 disabled:bg-gray-400 dark:bg-ac-secondary dark:hover:bg-ac-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ac-accent"
          >
            {status === 'submitting' ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
};
