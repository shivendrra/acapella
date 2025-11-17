// FIX: Changed firebase imports to use the '@firebase' scope.
import { User as FirebaseUser } from '@firebase/auth';
// FIX: Changed firebase imports to use the '@firebase' scope.
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
  duration: number; // in seconds
  releaseDate: string;
  genre: string;
  credits: Record<string, string[]>; // e.g., { "Producer": ["Name"], "Writer": ["Name1", "Name2"] }
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
  tracklist: string[]; // array of songIds
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
  socials?: Record<string, string>; // e.g., { "twitter": "url", "instagram": "url" }
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
  rating: number; // 1-5
  reviewText: string;
  createdAt: FieldValue | Timestamp;
  likes: string[]; // array of userIds
  likesCount?: number;
  // Denormalized data for feeds
  entityId: string; // songId or albumId
  entityType: 'song' | 'album' | 'user';
  entityTitle?: string;
  entityCoverArtUrl?: string; // For albums
  entityUsername?: string; // For user entities
}

export interface Like {
    id: string;
    userId: string;
    entityId: string;
    entityType: 'song' | 'album' | 'review';
    createdAt: FieldValue | Timestamp;
    // Denormalized data
    entityTitle?: string;
    entityCoverArtUrl?: string;
    // For review likes
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