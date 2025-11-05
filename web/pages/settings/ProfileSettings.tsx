import React from 'react';

const ProfileSettings: React.FC = () => {
  return (
    <div>
      <h2 className="text-3xl font-bold font-serif mb-4">Public Profile</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        This information will be displayed publicly on your profile page.
      </p>
      <div className="space-y-6">
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium">Display Name</label>
          <input type="text" id="displayName" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
        </div>
        <div>
          <label htmlFor="bio" className="block text-sm font-medium">Bio</label>
          <textarea id="bio" rows={4} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600"></textarea>
        </div>
        <button className="px-4 py-2 bg-ac-primary text-white rounded-md hover:bg-ac-primary/90">
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default ProfileSettings;
