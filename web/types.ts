import { User as FirebaseUser } from 'firebase/auth';
import { FieldValue, Timestamp } from 'firebase/firestore';

export enum Role {
  USER = 'user',
  ARTIST = 'artist',
  ADMIN = 'admin',
  MASTER_ADMIN = 'master_admin',
}

export interface UserProfile {
  uid: string;
  username: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: Role;
  bio?: string;
  createdAt?: FieldValue | Timestamp;
  profileComplete?: boolean;
  linkedAccounts?: {
    spotify?: string;
    appleMusic?: string;
    youtubeMusic?: string;
  };
  followersCount?: number;
  followingCount?: number;
}

export interface Song {
  id: string;
  title: string;
  title_lowercase?: string;
  artistIds: string[];
  albumId?: string;
  duration: number; // in seconds
  releaseDate: string;
  genre: string;
  credits: Record<string, string[]>; // e.g., { "Producer": ["Name"], "Writer": ["Name1", "Name2"] }
  platformLinks?: {
    spotify?: string;
    appleMusic?: string;
    youtubeMusic?: string;
  };
}

export interface Album {
  id: string;
  title: string;
  title_lowercase?: string;
  artistIds: string[];
  releaseDate: string;
  coverArtUrl: string;
  tracklist: string[]; // array of songIds
  associatedFilm?: string;
  platformLinks?: {
    spotify?: string;
    appleMusic?: string;
    youtubeMusic?: string;
  };
}

export interface Artist {
  id: string;
  name: string;
  name_lowercase?: string;
  imageUrl: string;
  genres: string[];
  // Fix: Add optional bio property to the Artist interface.
  bio?: string;
  socials?: Record<string, string>; // e.g., { "twitter": "url", "instagram": "url" }
}

export interface Review {
  id: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL: string | null;
  rating: number; // 1-5
  reviewText: string;
  createdAt: FieldValue | Timestamp;
  likes: string[]; // array of userIds
}

export interface Playlist {
  id: string;
  userId: string;
  name: string;
  description: string;
  songIds: string[];
  isPublic: boolean;
}

export interface AdminApplication {
  id:string;
  userId: string;
  userEmail: string;
  userName: string | null;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: FieldValue | Timestamp;
}

export interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
}

export interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}