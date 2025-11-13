
import React from 'react';
import { Mail, Github, Linkedin } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-5xl font-bold font-serif text-ac-dark dark:text-ac-light">About Acapella</h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          Your personal music diary, built with passion for music lovers.
        </p>
      </div>

      <div className="mt-16 text-center">
        <img
          src="https://avatars.githubusercontent.com/u/94288086?v=4" 
          alt="The Creator"
          className="w-40 h-40 rounded-full mx-auto object-cover border-4 border-ac-secondary shadow-lg"
        />
        <h2 className="mt-6 text-3xl font-bold font-serif">Hi, I'm Shivendra!</h2>
        <p className="mt-4 text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
          I'm a passionate full-stack engineer and UI/UX designer who believes music is more than just background noise—it's a story, a memory, and a vital part of our lives. I built Acapella as a love letter to music and to the communities that form around it, inspired by platforms like Letterboxd and Goodreads.
        </p>
        <p className="mt-4 text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
          My goal was to create a beautiful, intuitive space where you can not only track your listening habits but also share your thoughts and discover new artists through the lens of a trusted community. This project is a blend of my love for clean design, robust technology, and, of course, music.
        </p>
        <div className="mt-8 flex justify-center space-x-6">
          <a href="mailto:shivharsh44@gmail.com" className="text-gray-500 hover:text-ac-primary dark:hover:text-ac-secondary"><Mail size={28} /></a>
          <a href="https://github.com/shivendrra" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-ac-primary dark:hover:text-ac-secondary"><Github size={28} /></a>
          <a href="https://www.linkedin.com/in/shivendrra/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-ac-primary dark:hover:text-ac-secondary"><Linkedin size={28} /></a>
        </div>
      </div>

      <div className="mt-20 border-t pt-12 dark:border-gray-700">
        <h3 className="text-3xl font-bold font-serif text-center">The Technology</h3>
        <p className="text-center text-gray-600 dark:text-gray-400 mt-2">What makes Acapella tick.</p>
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="flex flex-col items-center">
                <p className="font-bold text-lg">React</p>
                <p className="text-sm text-gray-500">Frontend Library</p>
            </div>
             <div className="flex flex-col items-center">
                <p className="font-bold text-lg">TypeScript</p>
                <p className="text-sm text-gray-500">Language</p>
            </div>
             <div className="flex flex-col items-center">
                <p className="font-bold text-lg">Firebase</p>
                <p className="text-sm text-gray-500">Backend & Database</p>
            </div>
             <div className="flex flex-col items-center">
                <p className="font-bold text-lg">Tailwind CSS</p>
                <p className="text-sm text-gray-500">Styling</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;