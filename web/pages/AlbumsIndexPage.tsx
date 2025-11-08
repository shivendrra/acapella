import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit, Timestamp, collectionGroup } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { Album, Review } from '../types';
import PageLoader from '../components/common/PageLoader';
import { Star } from 'lucide-react';

const TrendingAlbumCard: React.FC<{ album: Album }> = ({ album }) => (
  <NavLink to={`/album/${album.id}`} className="group block">
    <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800">
      <img src={album.coverArtUrl} alt={album.title} className="h-full w-full object-cover object-center group-hover:opacity-75 transition-opacity" />
    </div>
    <h3 className="mt-2 font-semibold text-gray-900 dark:text-white truncate">{album.title}</h3>
    <div className="flex items-center mt-1 text-sm text-yellow-500">
      <Star size={14} className="mr-1 fill-current" />
      <span>{album.reviewCount || 0} Reviews</span>
    </div>
  </NavLink>
);

const FollowingReviewCard: React.FC<{ review: Review }> = ({ review }) => (
  <div className="p-4 border rounded-lg flex space-x-4">
    <NavLink to={`/album/${review.entityId}`}>
      <img src={review.entityCoverArtUrl} alt={review.entityTitle} className="w-24 h-24 rounded-md object-cover" />
    </NavLink>
    <div className="flex-1">
      <div className="flex items-center space-x-2 mb-1">
        <img src={review.userPhotoURL || ''} alt={review.userDisplayName} className="w-6 h-6 rounded-full" />
        <p className="font-semibold text-sm">{review.userDisplayName}</p>
      </div>
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => <Star key={i} size={14} className={` ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />)}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-2">"{review.reviewText}"</p>
    </div>
  </div>
);

const AlbumsIndexPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [trendingAlbums, setTrendingAlbums] = useState<Album[]>([]);
  const [followingReviews, setFollowingReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch trending albums (most reviewed)
        const trendingQuery = query(collection(db, 'albums'), orderBy('reviewCount', 'desc'), limit(12));
        const trendingSnap = await getDocs(trendingQuery);
        setTrendingAlbums(trendingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Album)));

        // Fetch reviews from followed users
        if (currentUser) {
          const followingRef = collection(db, 'follows');
          const followingQuery = query(followingRef, where('followerId', '==', currentUser.uid));
          const followingSnap = await getDocs(followingQuery);
          const followingIds = followingSnap.docs.map(doc => doc.data().followingId);

          if (followingIds.length > 0) {
            const reviewPromises = followingIds.map(userId => {
              const q = query(
                collectionGroup(db, 'reviews'),
                where('userId', '==', userId),
                where('entityType', '==', 'album'),
                orderBy('createdAt', 'desc'),
                limit(5)
              );
              return getDocs(q);
            });

            const reviewSnapshots = await Promise.all(reviewPromises);
            const allReviews = reviewSnapshots.flatMap(snapshot =>
              snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review))
            ).filter(review => review.reviewText.trim() !== '');

            // Sort and limit again after merging
            allReviews.sort((a, b) => {
              const timeA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
              const timeB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
              return timeB - timeA;
            });

            setFollowingReviews(allReviews.slice(0, 5));
          }
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load albums. Please try again. Note: This page may require a Firestore index to be created. Please check the developer console for a link to create it.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  if (loading) return <PageLoader />;
  if (error) return <div className="text-center py-20 text-ac-danger">{error}</div>;

  return (
    <div className="space-y-12">
      <h1 className="text-4xl font-bold font-serif">Albums</h1>

      {currentUser && followingReviews.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold font-serif mb-4">Reviews from Your Network</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {followingReviews.map(review => <FollowingReviewCard key={review.id} review={review} />)}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-2xl font-bold font-serif mb-4">Trending Albums</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {trendingAlbums.map(album => <TrendingAlbumCard key={album.id} album={album} />)}
        </div>
      </section>
    </div>
  );
};

export default AlbumsIndexPage;