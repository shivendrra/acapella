import React from 'react';

const PrivacySettings: React.FC = () => {
  return (
    <div>
      <h2 className="text-3xl font-bold font-serif mb-4">Privacy</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Control your privacy settings and who can see your activity.
      </p>
       <div className="space-y-6">
        <div className="p-4 border border-dashed rounded-md text-gray-500">
            <p>Privacy settings will be available here soon.</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;
