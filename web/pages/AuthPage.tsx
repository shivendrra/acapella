import React, { useState, useEffect } from 'react';
// FIX: Changed firebase imports to use the '@firebase' scope.
import { 
    GoogleAuthProvider, 
    signInWithPopup, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    fetchSignInMethodsForEmail,
    linkWithCredential,
} from '@firebase/auth';
import { auth } from '../services/firebase';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

const GoogleIcon = () => (
    <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C41.38,36.405,44,30.638,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);

const phrases = [
    { text: "Discover new music.", color: "text-ac-secondary", dotColor: "bg-ac-secondary" },
    { text: "Share your favorites.", color: "text-ac-accent", dotColor: "bg-ac-accent" },
    { text: "Acapella.", color: "text-white", dotColor: "bg-white" },
];

const Typewriter: React.FC = () => {
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [text, setText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const currentPhrase = phrases[phraseIndex];
        let timeout: number;

        if (isDeleting) {
            if (text.length > 0) {
                timeout = window.setTimeout(() => {
                    setText(t => t.slice(0, -1));
                }, 75);
            } else {
                setIsDeleting(false);
                setPhraseIndex(p => (p + 1) % phrases.length);
            }
        } else {
            if (text.length < currentPhrase.text.length) {
                timeout = window.setTimeout(() => {
                    setText(t => t + currentPhrase.text[t.length]);
                }, 150);
            } else {
                timeout = window.setTimeout(() => {
                    setIsDeleting(true);
                }, 2000);
            }
        }

        return () => clearTimeout(timeout);
    }, [text, isDeleting, phraseIndex]);

    const { color, dotColor } = phrases[phraseIndex];

    return (
        <h1 className={`text-5xl md:text-6xl font-serif font-bold ${color} transition-colors duration-500 flex items-center justify-center h-20`}>
            <span>{text}</span>
            <span className={`ml-3 mt-1 w-4 h-4 ${dotColor} rounded-full transition-colors duration-500`}></span>
        </h1>
    );
};

const AuthPage: React.FC = () => {
  const [view, setView] = useState<'initial' | 'login' | 'signup'>('initial');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [isLinking, setIsLinking] = useState(false);
  const [pendingCredential, setPendingCredential] = useState<any>(null);

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/account-exists-with-different-credential') {
        const email = err.customData.email;
        setError(`An account already exists with ${email}. Please sign in with your password to link your Google account.`);
        const credential = GoogleAuthProvider.credentialFromError(err);
        setPendingCredential(credential);
        setEmail(email);
        setView('login');
        setIsLinking(true);
      } else {
        setError(err.message);
      }
    }
  };

  const handleEmailPasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (view === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (isLinking && pendingCredential) {
          await linkWithCredential(userCredential.user, pendingCredential);
          setIsLinking(false);
          setPendingCredential(null);
        }
      } else { // 'signup' view
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if (methods.length > 0) {
            setError(`An account with this email already exists. Please log in with ${methods[0].replace('.com', '')}.`);
            return;
        }
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  const resetForm = () => {
    setView('initial');
    setEmail('');
    setPassword('');
    setError(null);
    setIsLinking(false);
    setPendingCredential(null);
  }

  if (view === 'initial') {
    return (
      <div className="flex flex-col md:flex-row min-h-screen w-full bg-[#2d0b4c]">
        <div className="w-full md:w-1/2 bg-[#2d0b4c] flex flex-grow items-center justify-center p-8">
            <Typewriter />
        </div>
        <div className="w-full md:w-1/2 bg-black rounded-t-3xl md:rounded-none p-8 pb-12 md:p-8 flex items-center justify-center">
            <div className="w-full max-w-sm mx-auto space-y-4">
                <button
                    onClick={handleGoogleSignIn}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm bg-white text-lg font-medium text-gray-900 hover:bg-gray-200 transition-colors"
                >
                    <GoogleIcon />
                    <span className="ml-3">Continue with Google</span>
                </button>
                <button
                    onClick={() => setView('signup')}
                    className="w-full py-3 px-4 border border-transparent rounded-xl shadow-sm bg-gray-800 text-lg font-medium text-white hover:bg-gray-700 transition-colors"
                >
                    Sign up
                </button>
                <button
                    onClick={() => setView('login')}
                    className="w-full py-3 px-4 border border-gray-700 rounded-xl shadow-sm bg-black text-lg font-medium text-white hover:bg-gray-800 transition-colors"
                >
                    Log in
                </button>
            </div>
        </div>
      </div>
    );
  }

  const isLogin = view === 'login';
  return (
    <div className="flex items-center justify-center min-h-screen bg-ac-light dark:bg-ac-dark py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <button
          onClick={resetForm}
          className="flex items-center font-medium text-ac-secondary hover:text-ac-secondary/80"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </button>
        
        <h2 className="mt-8 mb-4 text-center text-3xl font-extrabold text-ac-dark dark:text-ac-light font-serif">
            {isLinking ? 'Link Your Google Account' : (isLogin ? 'Welcome Back' : 'Create an Account')}
        </h2>
        {isLinking && (
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-8">
                Enter the password for <strong>{email}</strong> to continue.
            </p>
        )}

        <form className="space-y-6" onSubmit={handleEmailPasswordAuth}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 bg-white dark:bg-gray-800 rounded-t-md focus:outline-none focus:ring-ac-accent focus:border-ac-accent focus:z-10 sm:text-sm dark:text-white"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={isLinking}
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 bg-white dark:bg-gray-800 rounded-b-md focus:outline-none focus:ring-ac-accent focus:border-ac-accent focus:z-10 sm:text-sm dark:text-white"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="p-4 my-2 flex items-start text-sm text-red-800 bg-red-100 dark:text-red-100 dark:bg-red-900/50 border border-red-200 dark:border-red-500/50 rounded-lg">
                <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0" />
                <span>{error}</span>
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-ac-secondary hover:bg-ac-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ac-accent"
            >
              {isLinking ? 'Link Account & Log In' : (isLogin ? 'Log in' : 'Create account')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;