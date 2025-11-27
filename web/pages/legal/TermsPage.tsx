
import React from 'react';

const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold font-serif mb-6">Terms and Conditions</h1>
      <div className="prose dark:prose-invert max-w-none">
        <p className="text-gray-500 mb-6">Last Updated: {new Date().toLocaleDateString()}</p>
        <p className="mb-4">Welcome to Acapella. By using our website, you agree to these terms.</p>
        
        <h3 className="text-xl font-bold mt-6 mb-2">1. User Accounts</h3>
        <p className="mb-4 text-gray-600 dark:text-gray-400">You are responsible for maintaining the security of your account. You must not share your password or let others access your account.</p>

        <h3 className="text-xl font-bold mt-6 mb-2">2. Content</h3>
        <p className="mb-4 text-gray-600 dark:text-gray-400">Users are responsible for the reviews and content they post. We reserve the right to remove content that violates our community guidelines (e.g., hate speech, harassment).</p>

        <h3 className="text-xl font-bold mt-6 mb-2">3. Curator Program</h3>
        <p className="mb-4 text-gray-600 dark:text-gray-400">The Curator Program is a support tier. It does not grant ownership or special administrative rights over the platform's data, other than the visual badge and potential early access features.</p>
        
        <h3 className="text-xl font-bold mt-6 mb-2">4. Changes to Terms</h3>
        <p className="mb-4 text-gray-600 dark:text-gray-400">We may modify these terms at any time. Continued use of the platform constitutes agreement to the new terms.</p>
      </div>
    </div>
  );
};

export default TermsPage;
