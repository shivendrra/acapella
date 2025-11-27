
import React from 'react';
import { Mail } from 'lucide-react';

const ContactPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold font-serif mb-6">Contact Us</h1>
      <div className="prose dark:prose-invert max-w-none">
        <p className="text-gray-600 dark:text-gray-400 mb-8">We'd love to hear from you! Whether you have a question about features, trials, pricing, need a demo, or anything else, our team is ready to answer all your questions.</p>
        
        <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-4">
            <div className="p-3 bg-ac-primary text-white rounded-full">
                <Mail size={24} />
            </div>
            <div>
                <h3 className="font-bold text-lg">Email Support</h3>
                <p className="text-gray-600 dark:text-gray-400">For general inquiries and support:</p>
                <a href="mailto:freakingaura@gmail.com" className="text-ac-secondary font-bold hover:underline">freakingaura@gmail.com</a>
            </div>
        </div>

        <div className="mt-8">
            <h3 className="text-xl font-bold mb-2">Registered Address</h3>
            <p className="text-gray-600 dark:text-gray-400">Acapella HQ,<br/>Sector-49, Noida,<br/> UP, India 201304</p>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
