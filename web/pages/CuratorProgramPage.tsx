
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { doc, updateDoc, Timestamp } from '@firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, Zap, Heart, Loader } from 'lucide-react';

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

    // Using the provided Razorpay Test Key ID
    const razorpayKey = process.env.REACT_APP_RAZORPAY_KEY;

    setLoading(plan);
    setError('');

    if (!window.Razorpay) {
      setError("Payment gateway failed to load. Please check your network connection and try again.");
      setLoading(null);
      return;
    }

    const options = {
      key: razorpayKey,
      amount: amount * 100, // Amount in cents
      currency: "USD",
      name: "Acapella",
      description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Curator Membership`,
      image: "/logo192.png",
      handler: async (response: any) => {
        try {
          const userRef = doc(db, 'users', currentUser.uid);

          // Calculate Expiry Date
          const now = new Date();
          const expiryDate = new Date(now);
          if (plan === 'monthly') {
            expiryDate.setDate(expiryDate.getDate() + 30);
          } else {
            expiryDate.setDate(expiryDate.getDate() + 365);
          }

          await updateDoc(userRef, {
            isCurator: true,
            curatorPlan: plan,
            curatorExpiresAt: Timestamp.fromDate(expiryDate)
          });

          alert(`Welcome, Curator! Your membership is active until ${expiryDate.toLocaleDateString()}.`);
          navigate(`/${userProfile.username}`);
          window.location.reload();
        } catch (updateError) {
          console.error("Failed to update user profile:", updateError);
          setError("Payment was successful, but we failed to update your profile. Please contact support with Payment ID: " + response.razorpay_payment_id);
        } finally {
          setLoading(null);
        }
      },
      prefill: {
        name: userProfile.displayName || "",
        email: userProfile.email || "",
      },
      notes: {
        plan: plan,
        userId: currentUser.uid,
      },
      theme: {
        color: "#6A9C89"
      },
      modal: {
        ondismiss: () => {
          setLoading(null);
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        console.error(response.error);
        setError(`Payment failed: ${response.error.description}`);
        setLoading(null);
      });
      rzp.open();
    } catch (err) {
      console.error("Razorpay initialization error:", err);
      setError("Could not initiate payment. Please try again.");
      setLoading(null);
    }
  };

  const benefits = [
    { icon: BadgeCheck, text: "Official Curator Badge on your profile" },
    { icon: Heart, text: "Directly support the Acapella platform" },
    { icon: Zap, text: "Early access to new features (coming soon)" },
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="text-center p-8 bg-gradient-to-br from-ac-secondary/20 to-transparent rounded-2xl mb-12">
        <h1 className="text-5xl font-bold font-serif text-ac-dark dark:text-ac-light mb-4">Become a Curator</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Support the platform you love, get recognized in the community, and help us build the future of music discovery.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-stretch">
        {/* Benefits Column */}
        <div className="p-8 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800/50 shadow-sm flex flex-col justify-center">
          <h2 className="text-3xl font-bold font-serif mb-8">Why Join?</h2>
          <ul className="space-y-6">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-center">
                <div className="p-2 bg-ac-secondary/10 rounded-full mr-4">
                  <benefit.icon className="h-6 w-6 text-ac-secondary" />
                </div>
                <span className="text-lg text-gray-700 dark:text-gray-200 font-medium">{benefit.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pricing Column */}
        <div className="p-8 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-900 shadow-xl flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-ac-accent/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold font-serif mb-2">Choose Your Plan</h2>
            <p className="text-gray-500 dark:text-gray-400">Cancel anytime. Secure payment via Razorpay.</p>
          </div>

          <div className="space-y-4 flex-grow">
            <button
              onClick={() => handlePayment('monthly', 5)}
              disabled={!!loading}
              className={`w-full text-left p-5 border-2 rounded-xl transition-all duration-200 flex justify-between items-center group
                                ${loading === 'monthly' ? 'border-ac-secondary bg-ac-secondary/5' : 'border-gray-200 dark:border-gray-700 hover:border-ac-secondary hover:shadow-md'}
                                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div>
                <p className="font-bold text-lg text-ac-dark dark:text-ac-light">Monthly</p>
                <p className="text-gray-500 text-sm">Flexible support</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-ac-dark dark:text-ac-light">$5</p>
                <p className="text-xs text-gray-400">/ month</p>
              </div>
              {loading === 'monthly' && <Loader className="animate-spin ml-4 text-ac-secondary" />}
            </button>

            <button
              onClick={() => handlePayment('yearly', 50)}
              disabled={!!loading}
              className={`w-full text-left p-5 border-2 rounded-xl transition-all duration-200 flex justify-between items-center group relative overflow-hidden
                                ${loading === 'yearly' ? 'border-ac-secondary bg-ac-secondary/5' : 'border-gray-200 dark:border-gray-700 hover:border-ac-secondary hover:shadow-md'}
                                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="absolute top-0 right-0 bg-ac-accent text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">
                Save 16%
              </div>
              <div>
                <p className="font-bold text-lg text-ac-dark dark:text-ac-light">Yearly</p>
                <p className="text-gray-500 text-sm">Best value</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-ac-dark dark:text-ac-light">$50</p>
                <p className="text-xs text-gray-400">/ year</p>
              </div>
              {loading === 'yearly' && <Loader className="animate-spin ml-4 text-ac-secondary" />}
            </button>
          </div>

          {error && (
            <div className="mt-6 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-300 text-center">
              {error}
            </div>
          )}

          <p className="text-xs text-center text-gray-400 mt-6">
            By continuing, you agree to our Terms of Service. Payments are processed securely.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CuratorProgramPage;
