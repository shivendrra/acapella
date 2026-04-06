import { User as FirebaseUser } from '@firebase/auth';
import { FieldValue, Timestamp } from '@firebase/firestore';

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
  isCurator?: boolean;
  curatorPlan?: 'monthly' | 'yearly';
  curatorExpiresAt?: FieldValue | Timestamp;
  bio?: string;
  createdAt?: FieldValue | Timestamp;
  profileComplete?: boolean;
  linkedAccounts?: {
    spotify?: string;
    appleMusic?: string;
    youtubeMusic?: string;
  };
  socials?: {
    twitter?: string;
    instagram?: string;
  };
  followersCount?: number;
  followingCount?: number;
  favoriteSongIds?: string[];
  favoriteAlbumIds?: string[];
}

export interface Song {
  id: string;
  title: string;
  title_lowercase?: string;
  artistIds: string[];
  albumId?: string;
  duration: number;
  releaseDate: string;
  genre: string;
  credits: Record<string, string[]>;
  coverArtUrl?: string;
  platformLinks?: {
    spotify?: string;
    appleMusic?: string;
    youtubeMusic?: string;
  };
  reviewCount?: number;
  likesCount?: number;
}

export interface Album {
  id: string;
  title: string;
  title_lowercase?: string;
  artistIds: string[];
  releaseDate: string;
  coverArtUrl: string;
  tracklist: string[];
  genre?: string;
  associatedFilm?: string;
  platformLinks?: {
    spotify?: string;
    appleMusic?: string;
    youtubeMusic?: string;
  };
  reviewCount?: number;
  likesCount?: number;
}

export interface Artist {
  id: string;
  name: string;
  name_lowercase?: string;
  imageUrl: string;
  coverImageUrl?: string;
  genres: string[];
  bio?: string;
  socials?: Record<string, string>;
  platformLinks?: {
    spotify?: string;
    appleMusic?: string;
    youtubeMusic?: string;
  };
}

export interface Playlist {
  id: string;
  userId: string;
  userDisplayName: string;
  title: string;
  description?: string;
  coverArtUrl?: string;
  songIds: string[];
  createdAt: FieldValue | Timestamp;
  updatedAt?: FieldValue | Timestamp;
  platformLinks?: {
    spotify?: string;
    appleMusic?: string;
    youtubeMusic?: string;
  };
}

export interface Review {
  id: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL: string | null;
  userRole?: Role;
  userIsCurator?: boolean;
  rating: number;
  reviewText: string;
  createdAt: FieldValue | Timestamp;
  likes: string[];
  likesCount?: number;
  entityId: string;
  entityType: 'song' | 'album' | 'user';
  entityTitle?: string;
  entityCoverArtUrl?: string;
  entityUsername?: string;
}

export interface Like {
  id: string;
  userId: string;
  entityId: string;
  entityType: 'song' | 'album' | 'review';
  createdAt: FieldValue | Timestamp;
  entityTitle?: string;
  entityCoverArtUrl?: string;
  reviewOnEntityType?: 'song' | 'album';
  reviewOnEntityId?: string;
  reviewOnEntityTitle?: string;
}

export interface Follow {
  followerId: string;
  followingId: string;
  createdAt: FieldValue | Timestamp;
}

export interface AdminApplication {
  id: string;
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