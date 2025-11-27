
import React from 'react';

const ShippingPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold font-serif mb-6">Shipping & Delivery</h1>
      <div className="prose dark:prose-invert max-w-none">
        <p className="text-lg font-medium mb-4">Acapella is a digital platform.</p>
        <p className="mb-4 text-gray-600 dark:text-gray-400"><strong>We do not ship physical products.</strong></p>
        <p className="mb-4 text-gray-600 dark:text-gray-400">All services, including the Curator Membership, are delivered digitally and instantaneously upon successful payment.</p>
      </div>
    </div>
  );
};

export default ShippingPage;
