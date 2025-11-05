import React from 'react';

const AccountSettings: React.FC = () => {
  return (
    <div>
      <h2 className="text-3xl font-bold font-serif mb-4">Account</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Manage your username, email, and other account settings.
      </p>
      <div className="space-y-6">
        <div>
          <label htmlFor="username" className="block text-sm font-medium">Username</label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400">
              acapella.app/
            </span>
            <input type="text" id="username" className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md sm:text-sm border-gray-300 dark:bg-gray-700 dark:border-gray-600" />
          </div>
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium">Email Address</label>
          <input type="email" id="email" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
        </div>
        <button className="px-4 py-2 bg-ac-primary text-white rounded-md hover:bg-ac-primary/90">
          Update Account
        </button>
      </div>
    </div>
  );
};

export default AccountSettings;
