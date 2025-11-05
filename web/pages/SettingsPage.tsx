import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { User, Shield } from 'lucide-react';

const settingsNav = [
  { name: 'Profile', href: '/settings/profile', icon: User },
  { name: 'Account', href: '/settings/account', icon: Shield },
];

const SettingsPage: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row gap-10">
      <aside className="md:w-1/4 lg:w-1/5">
        <h1 className="text-2xl font-bold font-serif mb-6">Settings</h1>
        <nav className="space-y-1">
          {settingsNav.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-ac-primary/10 text-ac-primary dark:bg-ac-secondary/20 dark:text-ac-secondary'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`
              }
            >
              <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
              <span>{item.name}</span>
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
