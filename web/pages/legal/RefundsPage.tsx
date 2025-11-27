
import React from 'react';

const RefundsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold font-serif mb-6">Cancellation & Refunds Policy</h1>
      <div className="prose dark:prose-invert max-w-none">
        <p className="text-gray-500 mb-6">Last Updated: {new Date().toLocaleDateString()}</p>
        <p className="mb-4">Thank you for supporting Acapella.</p>
        
        <h3 className="text-xl font-bold mt-6 mb-2">Curator Membership</h3>
        <p className="mb-4 text-gray-600 dark:text-gray-400">The Curator Membership is a voluntary contribution to support the platform. As stated during the checkout process:</p>
        <ul className="list-disc pl-5 mt-2 text-gray-600 dark:text-gray-400">
            <li className="mb-2">Membership payments are non-refundable.</li>
            <li>You may cancel your badge status at any time from your account settings, but no partial refunds will be issued for the remaining duration of your term (monthly or yearly).</li>
        </ul>

        <h3 className="text-xl font-bold mt-6 mb-2">Contact Us</h3>
        <p className="mb-4 text-gray-600 dark:text-gray-400">If you believe there has been an error in billing, please contact us at <a href="mailto:freakingaura@gmail.com" className="text-ac-primary underline">freakingaura@gmail.com</a>.</p>
      </div>
    </div>
  );
};

export default RefundsPage;
