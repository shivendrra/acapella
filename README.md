# Acapella

**Acapella** is a social platform for discovering, logging, and reviewing music—including songs, albums, and artists. Inspired by communities like Letterboxd and Goodreads, Acapella provides a dedicated space for music enthusiasts to chronicle their listening journey, share their opinions, and connect with others over a shared passion for music.

## Features

- **Rich Music Database:** Browse an extensive collection of songs, albums, and artists.
- **User Authentication:** Secure sign-up and login with Email/Password and Google OAuth, including account linking for existing emails.
- **Personalized Profiles:** Customizable user profiles with display names, bios, custom usernames, social links, and a showcase of favorite music.
- **Music Logging & Rating:** Log the music you listen to with a simple 5-star rating system.
- **In-Depth Reviews:** Write and share detailed reviews for any song or album.
- **Social Activity Feed:** Follow other users and see their latest reviews, ratings, and likes in your personalized "From Your Network" feed.
- **Discover & Explore:** Discover new releases, trending songs, and popular artists.
- **Powerful Search:** A comprehensive search page to find users, artists, albums, and songs, complete with search history.
- **Role-Based Access Control:**
  - **User:** Standard user with access to all social features.
  - **Admin:** Can manage the music database (add/edit content).
  - **Master Admin:** Can manage content and review admin applications.
- **Curator Program:** A mock subscription feature (using Razorpay's test mode) to support the platform and get a special badge.
- **Responsive Design & Dark Mode:** A seamless experience on any device, with a beautiful, user-switchable dark mode.

## Tech Stack

- **Frontend:**
  - [**React**](https://reactjs.org/) (with Hooks & Context API)
  - [**TypeScript**](https://www.typescriptlang.org/) for static typing
  - [**React Router**](https://reactrouter.com/) for client-side routing
  - [**Vite**](https://vitejs.dev/) for a fast development experience

- **Backend & Database:**
  - [**Firebase**](https://firebase.google.com/)
    - **Firestore:** NoSQL database for all application data.
    - **Firebase Authentication:** Manages user accounts and authentication.

- **Styling:**
  - [**Tailwind CSS**](https://tailwindcss.com/) for utility-first styling.
  - [**Lucide React**](https://lucide.dev/) for a beautiful and consistent icon set.
  - [**Google Fonts & Icons**](https://fonts.google.com/) for fonts & icon support.

## License

Distributed under the Apache 2.0 License.

A work in progress by Shivendrra
