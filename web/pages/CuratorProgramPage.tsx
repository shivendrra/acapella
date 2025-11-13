
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { doc, updateDoc } from '@firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, Zap, Heart, Check } from 'lucide-react';

// Declaration to inform TypeScript about the Razorpay object on the window
declare global {
  interface Window {
    Razorpay: any;
  }
}

const CuratorProgramPage: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<null | 'monthly' | 'yearly'>(null);
  const [error, setError] = useState('');

  const handlePayment = (plan: 'monthly' | 'yearly', amount: number) => {
    if (!currentUser || !userProfile) {
      setError("You must be logged in to become a Curator.");
      return;
    }

    setLoading(plan);
    setError('');

    const options = {
      key: "rzp_test_xxxxxxxxxxxxxx", // Dummy Test Key
      amount: amount * 100, // Amount in paise
      currency: "USD",
      name: "Acapella Curator Program",
      description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Subscription`,
      image: "/logo192.png",
      handler: async (response: any) => {
        // This is where you would normally verify the payment signature on your server.
        // For this dummy implementation, we'll assume success.
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userRef, { isCurator: true });
          // Give user feedback and redirect
          alert("Welcome, Curator! Your support means the world to us. Your profile has been updated.");
          navigate(`/${userProfile.username}`);
          window.location.reload(); // Force a refresh to update user context everywhere
        } catch (updateError) {
          console.error("Failed to update user profile:", updateError);
          setError("Payment was successful, but we failed to update your profile. Please contact support.");
        } finally {
          setLoading(null);
        }
      },
      prefill: {
        name: userProfile.displayName || "Music Lover",
        email: userProfile.email || "",
      },
      notes: {
        plan: plan,
        userId: currentUser.uid,
      },
      theme: {
        color: "#6A9C89" // ac-secondary
      },
      modal: {
        ondismiss: () => {
          setLoading(null);
        }
      }
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const benefits = [
    { icon: BadgeCheck, text: "Official Curator Badge on your profile" },
    { icon: Heart, text: "Directly support the Acapella platform" },
    { icon: Zap, text: "Early access to new features (coming soon)" },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center p-8 bg-ac-secondary/10 rounded-xl">
        <h1 className="text-5xl font-bold font-serif text-ac-dark dark:text-ac-light">Become a Curator</h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Support the platform you love, get recognized in the community, and help us build the future of music discovery.
        </p>
      </div>

      <div className="mt-12 grid md:grid-cols-2 gap-8 items-stretch">
        <div className="p-8 border rounded-lg">
          <h2 className="text-3xl font-bold font-serif mb-6">What You Get</h2>
          <ul className="space-y-4">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-start">
                <benefit.icon className="h-6 w-6 text-ac-secondary mr-3 mt-1 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">{benefit.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-8 border rounded-lg bg-white dark:bg-black/20 flex flex-col justify-between">
          <div>
            <h2 className="text-3xl font-bold font-serif mb-2">Choose Your Plan</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Select the plan that works best for you.</p>
          </div>
          <div className="space-y-4">
            <button
              onClick={() => handlePayment('monthly', 5)}
              disabled={!!loading}
              className="w-full text-left p-4 border-2 rounded-lg hover:border-ac-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <p className="font-bold text-lg">Monthly</p>
              <p><span className="text-2xl font-bold">$5</span> / month</p>
            </button>
            <button
              onClick={() => handlePayment('yearly', 50)}
              disabled={!!loading}
              className="w-full text-left p-4 border-2 rounded-lg hover:border-ac-secondary transition-colors relative disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="absolute top-2 right-2 text-xs font-semibold bg-ac-accent text-white px-2 py-0.5 rounded-full">Save 16%</span>
              <p className="font-bold text-lg">Yearly</p>
              <p><span className="text-2xl font-bold">$50</span> / year</p>
            </button>
          </div>
          {error && <p className="text-center text-sm text-ac-danger mt-4">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default CuratorProgramPage;
