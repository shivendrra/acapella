import React, { useState, useEffect } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { collection, query, where, getDocs, limit, orderBy, Timestamp, startAfter, collectionGroup } from 'firebase/firestore';
import { db } from '../services/firebase';
import { UserProfile, Review } from '../types';
import PageLoader from '../components/common/PageLoader';
import { Star } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const ReviewItemCard: React.FC<{ item: Review }> = ({ item }) => {
  const link = `/${item.entityType}/${item.entityId}`;
  return (
    <div className="flex flex-col sm:flex-row items-start space-x-0 sm:space-x-6 space-y-4 sm:space-y-0 p-4">
      <NavLink to={link} className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 block">
        <img src={item.entityCoverArtUrl} alt={item.entityTitle} className="w-full h-full object-cover rounded-lg shadow-md" />
      </NavLink>
      <div className="flex-1">
        <h3 className="text-xl font-bold font-serif">
          <NavLink to={link} className="hover:underline">{item.entityTitle}</NavLink>
        </h3>
        <div className="flex items-center my-1">
          {[...Array(5)].map((_, i) => <Star key={i} size={16} className={`${i < item.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />)}
        </div>
        <NavLink to={`/review/${item.id}`} className="text-sm text-gray-500 mb-2 hover:underline">
          Reviewed on {item.createdAt instanceof Timestamp ? item.createdAt.toDate().toLocaleDateString() : 'a while ago'}
        </NavLink>
        <blockquote className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mt-2">
          {item.reviewText}
        </blockquote>
      </div>
    </div>
  );
};

const UserReviewsPage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { currentUser } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserAndReviews = async () => {
      if (!username) return;
      setLoading(true);
      setError(null);
      setReviews([]);

      if (!currentUser) {
        setError("You must be logged in to view a user's written reviews.");
        setLoading(false);
        return;
      }

      try {
        const usersRef = collection(db, 'users');
        const userQuery = query(usersRef, where('username', '==', username), limit(1));
        const userSnap = await getDocs(userQuery);

        if (userSnap.empty) {
          setError('User not found.');
          setLoading(false);
          return;
        }
        const userData = userSnap.docs[0].data() as UserProfile;
        setUser(userData);

        const reviewsQuery = query(
          collectionGroup(db, 'reviews'),
          where('userId', '==', userData.uid),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const reviewsSnap = await getDocs(reviewsQuery);
        const allRecentActivity = reviewsSnap.docs.map(doc => doc.data() as Review);

        const writtenReviews = allRecentActivity.filter(
          item => item.reviewText && item.reviewText.trim() !== ''
        );

        setReviews(writtenReviews);
        setLastDoc(reviewsSnap.docs[reviewsSnap.docs.length - 1]);
        setHasMore(reviewsSnap.docs.length === 20);

      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load user's reviews. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndReviews();
  }, [username, currentUser]);

  const fetchMoreReviews = async () => {
    if (!user || !hasMore || loadingMore) return;

    setLoadingMore(true);
    try {
      const reviewsQuery = query(
        collectionGroup(db, 'reviews'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(20)
      );
      const reviewsSnap = await getDocs(reviewsQuery);
      const newActivity = reviewsSnap.docs.map(doc => doc.data() as Review);

      const newWrittenReviews = newActivity.filter(
        item => item.reviewText && item.reviewText.trim() !== ''
      );

      setReviews(prev => [...prev, ...newWrittenReviews]);
      setLastDoc(reviewsSnap.docs[reviewsSnap.docs.length - 1]);
      setHasMore(reviewsSnap.docs.length === 20);
    } catch (err) {
      console.error("Error fetching more reviews:", err);
      setError("Failed to load more items.");
    } finally {
      setLoadingMore(false);
    }
  };


  if (loading) return <PageLoader />;
  if (error) return <div className="text-center py-20 text-ac-danger">{error}</div>;

  return (
    <div>
      <h1 className="text-4xl font-bold font-serif mb-2">Reviews by {user?.displayName || username}</h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">All written reviews from this user.</p>

      {reviews.length > 0 ? (
        <div className="border rounded-lg dark:border-gray-700 overflow-hidden">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {reviews.map(item => (
              <li key={item.id} className="transition-colors odd:bg-transparent even:bg-black/[.03] dark:even:bg-white/[.03]">
                <ReviewItemCard item={item} />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed rounded-lg text-gray-500">
          <p>{user?.displayName || username} hasn't written any reviews yet.</p>
        </div>
      )}

      {hasMore && (
        <div className="text-center mt-12">
          <button onClick={fetchMoreReviews} disabled={loadingMore} className="px-6 py-2 bg-ac-primary text-white rounded-md hover:bg-ac-primary/90 disabled:bg-gray-400">
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};

export default UserReviewsPage;