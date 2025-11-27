
import React, { useState } from 'react';
import { ChevronDown, Mail } from 'lucide-react';

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full py-5 text-left font-semibold text-lg"
      >
        <span>{title}</span>
        <ChevronDown className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div
        className={`grid overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="pb-5 text-gray-600 dark:text-gray-400">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

const faqData = [
    {
      question: 'What is Acapella?',
      answer: 'Acapella is a social platform for music lovers. It allows you to log the music you listen to, rate and review songs and albums, and share your musical taste with a community of friends and fellow fans. Think of it like Letterboxd or Goodreads, but for music.',
    },
    {
      question: 'How do I add a song or album?',
      answer: 'Currently, adding new music to the database is restricted to users with Admin roles. We do this to maintain the quality and accuracy of our data. If you are passionate about music and want to contribute, you can apply to become an admin through your profile menu.',
    },
    {
      question: 'How do ratings work?',
      answer: 'You can rate any song or album on a scale of 1 to 5 stars. Your ratings help you remember what you thought of a piece of music and contribute to the overall community rating. You can also write a full review to share more detailed thoughts.',
    },
    {
      question: 'What is a Curator?',
      answer: 'The Curator program is a special tier for users who wish to support the Acapella project. By upgrading, you\'ll receive a "Curator" badge on your profile as a thank you for helping us grow. It\'s a way for dedicated community members to stand out.',
    },
    {
      question: 'How can I change my username or profile picture?',
      answer: 'You can update your public profile information, including your display name, bio, and favorite music, by going to Settings > Profile. To change your username, navigate to Settings > Account.',
    },
];

const HelpPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-5xl font-bold font-serif text-ac-dark dark:text-ac-light">Help & Support</h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          Find answers to your questions and get in touch with our team.
        </p>
      </div>

      <div className="mt-16">
        <h2 className="text-3xl font-bold font-serif mb-6">Frequently Asked Questions</h2>
        <div className="space-y-2">
            {faqData.map((item, index) => (
                <AccordionItem key={index} title={item.question}>
                    <p>{item.answer}</p>
                </AccordionItem>
            ))}
        </div>
      </div>

      <div className="mt-20 text-center p-8 border-2 border-dashed rounded-lg">
        <h2 className="text-2xl font-bold font-serif">Still have questions?</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          If you can't find the answer you're looking for, feel free to reach out to our support team.
        </p>
        <a 
            href="mailto:freakingaura@gmail.com"
            className="mt-6 inline-flex items-center px-6 py-3 bg-ac-primary text-white font-semibold rounded-lg hover:bg-ac-primary/90 transition-colors"
        >
            <Mail className="mr-2 h-5 w-5" />
            Contact Support
        </a>
      </div>
    </div>
  );
};

export default HelpPage;
