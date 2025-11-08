import React from 'react';
import { Link } from 'react-router-dom';
import { Music4 } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="text-center py-20">
      <Music4 className="mx-auto h-24 w-24 text-ac-secondary animate-pulse" />
      <h1 className="mt-4 text-4xl font-bold font-serif tracking-tight text-ac-dark dark:text-ac-light sm:text-5xl">
        Page Not Found
      </h1>
      <p className="mt-6 text-base leading-7 text-gray-600 dark:text-gray-400">
        Sorry, we couldn’t find the page you’re looking for. The record might be scratched.
      </p>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        <Link
          to="/"
          className="rounded-md bg-ac-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-ac-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
