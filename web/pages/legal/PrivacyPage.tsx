
import React from 'react';

const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold font-serif mb-6">Privacy Policy</h1>
      <div className="prose dark:prose-invert max-w-none">
        <p className="text-gray-500 mb-6">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <h3 className="text-xl font-bold mt-6 mb-2">1. Data Collection</h3>
        <p className="mb-4 text-gray-600 dark:text-gray-400">We collect information you provide directly to us, such as your email address, username, and profile picture when you create an account. We also track your interactions (reviews, likes, follows) to provide the service.</p>

        <h3 className="text-xl font-bold mt-6 mb-2">2. Data Usage</h3>
        <p className="mb-4 text-gray-600 dark:text-gray-400">We use your data to operate, maintain, and improve Acapella. We do not sell your personal data to third parties.</p>

        <h3 className="text-xl font-bold mt-6 mb-2">3. Payments</h3>
        <p className="mb-4 text-gray-600 dark:text-gray-400">Payment processing for the Curator Program is handled by Razorpay. We do not store your credit card information on our servers.</p>
      </div>
    </div>
  );
};

export default PrivacyPage;
