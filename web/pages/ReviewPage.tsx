

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, NavLink, useNavigate } from 'react-router-dom';
import { collectionGroup, query, where, getDocs, limit, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp, increment, arrayUnion, arrayRemove, collection, documentId, DocumentReference, writeBatch } from '@firebase/firestore';
import { db } from '../services/firebase';
import { Review, Song, Album, Artist, UserProfile, Like } from '../types';
import { useAuth } from '../hooks/useAuth';
import PageLoader from '../components/common/PageLoader';
import { Star, Heart, Edit, Trash2, X } from 'lucide-react';
import { formatDate } from '../utils/formatters';
import UserBadges from '../components/common/UserBadges';

type Entity = (Song | Album) & { artists: Artist[] };

const StarRatingDisplay: React.FC<{ rating: number; size?: number }> = ({ rating, size = 5 }) => (
    <div className="flex items-center">
      {[...Array(5)].map((_, index) => (
        <Star key={index} className={`h-${size} w-${size} ${index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`} />
      ))}
    </div>
);

const LikerItem: React.FC<{ liker: UserProfile }> = ({ liker }) => (
    <NavLink to={`/${liker.username}`} title={liker.displayName || liker.username}>
        <img
          src={liker.photoURL || `https://ui-avatars.com/api/?name=${liker.displayName || liker.username}`}
          alt={liker.displayName || ''}
          className="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-gray-800 hover:scale-110 transition-transform"
        />
    </NavLink>
);


const ReviewPage: React.FC = () => {
    const { id: reviewId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentUser, userProfile } = useAuth();

    const [review, setReview] = useState<Review | null>(null);
    const [reviewRef, setReviewRef] = useState<DocumentReference | null>(null);
    const [reviewerProfile, setReviewerProfile] = useState<UserProfile | null>(null);
    const [entity, setEntity] = useState<Entity | null>(null);
    const [likers, setLikers] = useState<UserProfile[]>([]);
    
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchReviewData = useCallback(async () => {
        if (!reviewId) { setError("Review not found."); return; }
        
        setLoading(true);
        setError(null);

        try {
            // 1. Fetch the review using a collectionGroup query
            const reviewsQuery = query(collectionGroup(db, 'reviews'), where('id', '==', reviewId), limit(1));
            const reviewSnap = await getDocs(reviewsQuery);
            if (reviewSnap.empty) { setError("Review not found."); setLoading(false); return; }
            
            const reviewDoc = reviewSnap.docs[0];
            const reviewData = reviewDoc.data() as Review;
            setReview(reviewData);
            setReviewRef(reviewDoc.ref); // Store the direct document reference
            setLikesCount(reviewData.likesCount ?? reviewData.likes.length);
            if (currentUser) setIsLiked(reviewData.likes.includes(currentUser.uid));
            
            // 2. Fetch the reviewer's profile
            const reviewerRef = doc(db, 'users', reviewData.userId);
            const reviewerSnap = await getDoc(reviewerRef);
            if (reviewerSnap.exists()) setReviewerProfile(reviewerSnap.data() as UserProfile);

            // 3. Fetch the associated entity (song or album)
            const entityRef = doc(db, reviewData.entityType === 'song' ? 'songs' : 'albums', reviewData.entityId);
            const entitySnap = await getDoc(entityRef);
            if (!entitySnap.exists()) { setError("Associated music not found."); setLoading(false); return; }
            const entityData = entitySnap.data() as Song | Album;

            // 4. Fetch the artists for the entity
            let artists: Artist[] = [];
            if (entityData.artistIds?.length > 0) {
                const artistsQuery = query(collection(db, 'artists'), where(documentId(), 'in', entityData.artistIds));
                const artistsSnap = await getDocs(artistsQuery);
                artists = artistsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Artist));
            }
            setEntity({ ...entityData, artists });

            // 5. Fetch profiles of likers
            if (reviewData.likes && reviewData.likes.length > 0) {
                const likerIds = reviewData.likes.slice(0, 10); // Limit to 10 for display performance
                const likersQuery = query(collection(db, 'users'), where(documentId(), 'in', likerIds));
                const likersSnap = await getDocs(likersQuery);
                setLikers(likersSnap.docs.map(d => d.data() as UserProfile));
            }

        } catch (e: any) {
            console.error(e);
            setError("Failed to load review. It may not exist or you may not have permission to view it.");
        } finally {
            setLoading(false);
        }
    }, [reviewId, currentUser]);

    useEffect(() => {
        fetchReviewData();
    }, [fetchReviewData]);

    const handleLikeToggle = async () => {
        if (!currentUser || !reviewRef || !review || !entity) return;

        const newIsLiked = !isLiked;

        // Optimistic UI update
        setIsLiked(newIsLiked);
        setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);
        if (newIsLiked) {
            // Add self to likers list optimistically if profile exists
            if (userProfile) setLikers(prev => [userProfile, ...prev.filter(l => l.uid !== userProfile.uid)]);
        } else {
            setLikers(prev => prev.filter(l => l.uid !== currentUser.uid));
        }

        try {
            const batch = writeBatch(db);
            const likeDocRef = doc(db, 'likes', `${currentUser.uid}_${review.id}`);

            // Update the review document's likes array and count
            batch.update(reviewRef, {
                likes: newIsLiked ? arrayUnion(currentUser.uid) : arrayRemove(currentUser.uid),
                likesCount: increment(newIsLiked ? 1 : -1)
            });

            // Create/delete the corresponding like document for activity feeds
            if (newIsLiked) {
                const likeDoc: Like = {
                    id: likeDocRef.id,
                    userId: currentUser.uid,
                    entityId: review.id,
                    entityType: 'review',
                    createdAt: serverTimestamp(),
                    entityTitle: `Review for "${entity.title}"`,
                    entityCoverArtUrl: entity.coverArtUrl,
                    reviewOnEntityType: review.entityType as 'song' | 'album',
                    reviewOnEntityId: review.entityId,
                    reviewOnEntityTitle: entity.title,
                };
                batch.set(likeDocRef, likeDoc);
            } else {
                batch.delete(likeDocRef);
            }

            await batch.commit();

        } catch (err) {
            console.error("Failed to update like:", err);
            // Revert optimistic UI on error
            fetchReviewData(); 
            setError("Failed to update like. Please check your connection and try again.");
        }
    };
    
    const handleDelete = async () => {
        if (!review || !currentUser || currentUser.uid !== review.userId || !reviewRef) return;
        if (window.confirm("Are you sure you want to delete this review? This cannot be undone.")) {
            try {
                await deleteDoc(reviewRef);
                navigate(`/${review.entityType}/${review.entityId}`);
            } catch (err) {
                console.error(err);
                setError("Failed to delete review.");
            }
        }
    };


    if (loading) return <PageLoader />;
    if (error) return <div className="text-center py-20 text-ac-danger">{error}</div>;
    if (!review || !reviewerProfile || !entity) return null;

    const isAuthor = currentUser?.uid === review.userId;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
           <section className="flex flex-col sm:flex-row gap-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <NavLink to={`/${review.entityType}/${review.entityId}`} className="flex-shrink-0 w-32 h-32 mx-auto sm:mx-0">
                    <img src={entity.coverArtUrl} alt={entity.title} className="w-full h-full object-cover rounded-md shadow-lg" />
                </NavLink>
                <div className="text-center sm:text-left">
                    <h1 className="text-3xl font-bold font-serif">{entity.title}</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        by{' '}
                        {entity.artists.map((artist, index) => (
                            <span key={artist.id}>
                                <NavLink to={`/artist/${artist.id}`} className="font-semibold hover:underline text-ac-secondary">
                                    {artist.name}
                                </NavLink>
                                {index < entity.artists.length - 1 && ', '}
                            </span>
                        ))}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">{formatDate(entity.releaseDate)}</p>
                </div>
           </section>

           <section>
               <div className="flex items-start space-x-4">
                   <NavLink to={`/${reviewerProfile.username}`}>
                    <img src={reviewerProfile.photoURL || ''} alt={reviewerProfile.displayName || ''} className="w-12 h-12 rounded-full object-cover"/>
                   </NavLink>
                   <div>
                       <p className="flex items-center">Review by <NavLink to={`/${reviewerProfile.username}`} className="font-semibold hover:underline ml-1 inline-flex items-center">{reviewerProfile.displayName}<UserBadges user={reviewerProfile} /></NavLink></p>
                       <div className="flex items-center space-x-2">
                           <StarRatingDisplay rating={review.rating} size={5} />
                           <span className="text-sm text-gray-500 pt-px">on {formatDate(review.createdAt)}</span>
                       </div>
                   </div>
               </div>
               
               {review.reviewText && (
                   <div className="mt-4 pl-16">
                       <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap text-lg">{review.reviewText}</p>
                   </div>
               )}

               <div className="mt-6 pl-16 flex items-center justify-between">
                   <div className="flex items-center space-x-4">
                        {currentUser ? (
                           <button onClick={handleLikeToggle} className="flex items-center space-x-1.5 text-gray-500 hover:text-red-500 transition-colors">
                               <Heart className={`h-6 w-6 ${isLiked ? 'text-red-500 fill-current' : ''}`} />
                               <span className="font-semibold">{likesCount}</span>
                           </button>
                        ) : (
                            <div className="flex items-center space-x-1.5 text-gray-500">
                               <Heart className="h-6 w-6" />
                               <span className="font-semibold">{likesCount}</span>
                           </div>
                        )}
                       {isAuthor && (
                           <>
                           {/*  // TODO: Implement Edit Modal */}
                           <button onClick={() => alert("Edit functionality coming soon!")} className="flex items-center space-x-1.5 text-gray-500 hover:text-ac-secondary transition-colors">
                               <Edit className="h-5 w-5" />
                               <span>Edit</span>
                           </button>
                           <button onClick={handleDelete} className="flex items-center space-x-1.5 text-gray-500 hover:text-ac-danger transition-colors">
                               <Trash2 className="h-5 w-5" />
                               <span>Delete</span>
                           </button>
                           </>
                       )}
                   </div>
                   
                   {likers.length > 0 && (
                       <div className="flex items-center -space-x-2">
                           {likers.map(liker => <LikerItem key={liker.uid} liker={liker} />)}
                       </div>
                   )}
               </div>
           </section>
        </div>
    );
};

export default ReviewPage;