import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { User, Shield, Key, Bell, Eye, Link as LinkIcon } from 'lucide-react';

const settingsNav = [
  { name: 'Profile', href: '/settings/profile', icon: User },
  { name: 'Account', href: '/settings/account', icon: Shield },
  { name: 'Security', href: '/settings/security', icon: Key },
  { name: 'Connections', href: '/settings/connections', icon: LinkIcon },
  { name: 'Notifications', href: '/settings/notifications', icon: Bell },
  { name: 'Privacy', href: '/settings/privacy', icon: Eye },
];

const SettingsPage: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row gap-8 md:gap-10">
      <aside className="md:w-1/4 lg:w-1/5">
        <h1 className="text-2xl font-bold font-serif mb-6 hidden md:block">Settings</h1>
        <nav className="flex flex-row justify-between md:flex-col md:space-y-1 md:justify-start border-b md:border-0 border-gray-200 dark:border-gray-700 md:pb-0 pb-2 mb-6 md:mb-0 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          {settingsNav.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center justify-center md:justify-start px-3 py-2 text-sm font-medium rounded-md flex-shrink-0 ${
                  isActive
                    ? 'bg-ac-primary/10 text-ac-primary dark:bg-ac-secondary/20 dark:text-ac-secondary'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`
              }
            >
              <item.icon className="h-6 w-6 md:h-5 md:w-5 md:mr-3" aria-hidden="true" />
              <span className="hidden md:inline">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};

export default SettingsPage;