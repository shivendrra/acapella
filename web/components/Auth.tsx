

import React, { useState } from 'react';
// FIX: Changed firebase imports to use the '@firebase' scope.
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '@firebase/auth';
import { auth } from '../services/firebase';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const GoogleIcon = () => (
    <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C41.38,36.405,44,30.638,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);

export const AuthPage: React.FC = () => {
  const [view, setView] = useState<'initial' | 'login' | 'signup'>('initial');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEmailPasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (view === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (view === 'initial') {
    return (
      <div className="flex flex-col items-center justify-between min-h-screen w-full bg-ac-primary text-ac-light p-8">
        <div className="w-full flex-grow flex items-center justify-center -mt-16">
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-ac-secondary flex items-center">
            Acapella
            <span className="ml-3 mt-2 w-4 h-4 bg-ac-secondary rounded-full"></span>
          </h1>
        </div>
        <div className="w-full max-w-sm space-y-4">
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-full shadow-sm bg-white text-lg font-medium text-black hover:bg-gray-200 transition-colors"
          >
            <GoogleIcon />
            <span className="ml-3">Continue with Google</span>
          </button>
          <button
            onClick={() => setView('signup')}
            className="w-full py-3 px-4 border border-transparent rounded-full shadow-sm bg-gray-300 text-lg font-medium text-black hover:bg-gray-400 transition-colors"
          >
            Sign up
          </button>
          <button
            onClick={() => setView('login')}
            className="w-full py-3 px-4 border border-transparent rounded-full shadow-sm bg-black text-lg font-medium text-white hover:bg-gray-800 transition-colors"
          >
            Log in
          </button>
        </div>
      </div>
    );
  }

  const isLogin = view === 'login';
  return (
    <div className="flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 relative">
        <button
          onClick={() => setView('initial')}
          className="absolute -top-12 left-0 flex items-center font-medium text-ac-primary hover:text-ac-primary/80 dark:text-ac-secondary dark:hover:text-ac-secondary/80"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </button>
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-ac-dark dark:text-ac-light font-serif">
            {isLogin ? 'Welcome Back' : 'Create an Account'}
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleEmailPasswordAuth}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-ac-accent focus:border-ac-accent focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-ac-accent focus:border-ac-accent focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-ac-danger text-center">{error}</p>}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-ac-primary hover:bg-ac-primary/90 dark:bg-ac-secondary dark:hover:bg-ac-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ac-accent"
            >
              {isLogin ? 'Log in' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};