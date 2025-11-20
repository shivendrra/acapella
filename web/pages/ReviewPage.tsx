
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, NavLink, useNavigate } from 'react-router-dom';
import { collectionGroup, query, where, getDocs, limit, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, increment, arrayUnion, arrayRemove, collection, documentId, DocumentReference, writeBatch } from '@firebase/firestore';
import { db } from '../services/firebase';
import { Review, Song, Album, Artist, UserProfile, Like } from '../types';
import { useAuth } from '../hooks/useAuth';
import PageLoader from '../components/common/PageLoader';
import { Star, Heart, Edit, Trash2, X, Save, Loader } from 'lucide-react';
import { formatDate } from '../utils/formatters';

type Entity = (Song | Album) & { artists: Artist[] };

const StarRatingDisplay: React.FC<{ rating: number; size?: number }> = ({ rating, size = 5 }) => (
    <div className="flex items-center">
      {[...Array(5)].map((_, index) => (
        <Star key={index} className={`h-${size} w-${size} ${index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`} />
      ))}
    </div>
);

interface EditReviewModalProps {
    review: Review;
    onClose: () => void;
    onSave: (newRating: number, newText: string) => Promise<void>;
}

const EditReviewModal: React.FC<EditReviewModalProps> = ({ review, onClose, onSave }) => {
    const [rating, setRating] = useState(review.rating);
    const [hoverRating, setHoverRating] = useState(0);
    const [text, setText] = useState(review.reviewText);
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave(rating, text);
        setIsSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-ac-light dark:bg-ac-dark rounded-xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold font-serif">Edit Review</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Rating</label>
                        <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, index) => {
                                const starValue = index + 1;
                                return (
                                    <button
                                        type="button"
                                        key={starValue}
                                        onClick={() => setRating(starValue)}
                                        onMouseEnter={() => setHoverRating(starValue)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        className="focus:outline-none"
                                    >
                                        <Star className={`h-8 w-8 transition-colors ${
                                            starValue <= (hoverRating || rating)
                                            ? 'text-yellow-400 fill-current'
                                            : 'text-gray-300 dark:text-gray-600'
                                        }`} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Review</label>
                        <textarea 
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            rows={5}
                            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-ac-secondary focus:outline-none transition-shadow dark:text-white"
                            placeholder="Update your thoughts..."
                        />
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSaving}
                            className="px-4 py-2 text-sm font-semibold text-white bg-ac-primary hover:bg-ac-primary/90 dark:bg-ac-secondary dark:hover:bg-ac-secondary/90 rounded-lg shadow-sm flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? <Loader size={16} className="animate-spin"/> : <Save size={16} />}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


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
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
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
            setReviewRef(reviewDoc.ref);
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
                const likerIds = reviewData.likes.slice(0, 5);
                const likersQuery = query(collection(db, 'users'), where(documentId(), 'in', likerIds));
                const likersSnap = await getDocs(likersQuery);
                setLikers(likersSnap.docs.map(d => d.data() as UserProfile));
            }

        } catch (e: any) {
            console.error(e);
            setError("Failed to load review.");
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
            if (userProfile) setLikers(prev => [userProfile, ...prev.filter(l => l.uid !== userProfile.uid)].slice(0,5));
        } else {
            setLikers(prev => prev.filter(l => l.uid !== currentUser.uid));
        }

        try {
            const batch = writeBatch(db);
            const likeDocRef = doc(db, 'likes', `${currentUser.uid}_${review.id}`);

            batch.update(reviewRef, {
                likes: newIsLiked ? arrayUnion(currentUser.uid) : arrayRemove(currentUser.uid),
                likesCount: increment(newIsLiked ? 1 : -1)
            });

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
            fetchReviewData(); // Revert on error
        }
    };
    
    const handleUpdateReview = async (newRating: number, newText: string) => {
        if (!reviewRef) return;
        try {
            await updateDoc(reviewRef, {
                rating: newRating,
                reviewText: newText,
            });
            setReview(prev => prev ? { ...prev, rating: newRating, reviewText: newText } : null);
        } catch (err) {
            console.error("Failed to update review:", err);
            alert("Failed to update review. Please try again.");
        }
    };

    const handleDelete = async () => {
        if (!review || !currentUser || currentUser.uid !== review.userId || !reviewRef || !entity) return;
        
        if (!window.confirm("Are you sure you want to delete this review? This cannot be undone.")) return;

        try {
            const batch = writeBatch(db);
            batch.delete(reviewRef);

            const parentRef = doc(db, review.entityType === 'song' ? 'songs' : 'albums', review.entityId);
            batch.update(parentRef, { reviewCount: increment(-1) });

            const reviewLikesQuery = query(
                collection(db, 'likes'), 
                where('entityId', '==', review.id), 
                where('entityType', '==', 'review')
            );
            const reviewLikesSnap = await getDocs(reviewLikesQuery);
            reviewLikesSnap.forEach(likeDoc => {
                batch.delete(likeDoc.ref);
            });

            await batch.commit();
            navigate(`/${review.entityType}/${review.entityId}`);
            
        } catch (err) {
            console.error("Delete failed:", err);
            setError("Failed to delete review. Please try again.");
        }
    };


    if (loading) return <PageLoader />;
    if (error) return <div className="text-center py-20 text-ac-danger">{error}</div>;
    if (!review || !reviewerProfile || !entity) return null;

    const isAuthor = currentUser?.uid === review.userId;

    return (
        <div className="max-w-2xl mx-auto py-12 px-4">
             {/* Entity Info Header */}
             <div className="flex flex-col items-center text-center mb-10">
                <NavLink 
                    to={`/${review.entityType}/${review.entityId}`}
                    className="block mb-6 shadow-2xl rounded-md overflow-hidden transition-transform hover:scale-105 duration-300"
                >
                    <img 
                        src={entity.coverArtUrl} 
                        alt={entity.title} 
                        className="w-48 h-48 sm:w-56 sm:h-56 object-cover" 
                    />
                </NavLink>

                <h1 className="text-4xl font-serif font-bold text-ac-dark dark:text-ac-light mb-2">
                    {entity.title}
                </h1>
                
                <div className="text-lg mb-2">
                    <span className="text-gray-500 dark:text-gray-400">by </span>
                    {entity.artists.map((artist, i) => (
                         <span key={artist.id}>
                            <NavLink to={`/artist/${artist.id}`} className="font-semibold text-ac-secondary hover:underline">
                                {artist.name}
                            </NavLink>
                            {i < entity.artists.length - 1 && ', '}
                         </span>
                    ))}
                </div>

                <div className="text-sm text-gray-500 uppercase tracking-widest font-medium">
                    {formatDate(entity.releaseDate)}
                </div>
            </div>

            {/* Review Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sm:p-8 border border-gray-100 dark:border-gray-700">
                
                {/* Header: User Info */}
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <NavLink to={`/${reviewerProfile.username}`}>
                            <img 
                                src={reviewerProfile.photoURL || `https://ui-avatars.com/api/?name=${reviewerProfile.displayName}`} 
                                className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-700" 
                            />
                        </NavLink>
                        <div>
                            <div className="flex items-center gap-2">
                                <NavLink to={`/${reviewerProfile.username}`} className="font-bold text-lg text-gray-900 dark:text-white hover:underline">
                                    {reviewerProfile.displayName}
                                </NavLink>
                            </div>
                            <div className="text-sm text-gray-500">
                                Reviewed on {formatDate(review.createdAt)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Rating Pill */}
                <div className="flex items-center gap-3 mb-6 bg-gray-50 dark:bg-gray-700/30 w-fit px-3 py-2 rounded-lg">
                        <StarRatingDisplay rating={review.rating} size={5} />
                        <span className="font-bold text-gray-900 dark:text-white text-lg">{review.rating}/5</span>
                </div>

                {/* Review Text */}
                <div className="mb-8">
                    <p className="font-serif text-xl text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                        {review.reviewText || <span className="text-gray-400 italic">No text review.</span>}
                    </p>
                </div>

                {/* Footer: Likes & Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={currentUser ? handleLikeToggle : undefined}
                            className={`flex items-center gap-2 transition-colors ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                            disabled={!currentUser}
                        >
                            <Heart className={isLiked ? "fill-current" : ""} size={20} />
                            <span className="font-semibold">{likesCount} Likes</span>
                        </button>
                        {likers.length > 0 && (
                            <div className="flex -space-x-2 ml-2">
                                {likers.map(l => (
                                    <img key={l.uid} src={l.photoURL || ''} className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 object-cover" title={l.displayName || ''} />
                                ))}
                            </div>
                        )}
                    </div>

                    {isAuthor && (
                        <div className="flex gap-4 text-sm font-medium text-gray-500">
                            <button onClick={() => setIsEditModalOpen(true)} className="hover:text-ac-secondary flex items-center gap-1 transition-colors">
                                <Edit size={16}/> Edit
                            </button>
                            <button onClick={handleDelete} className="hover:text-ac-danger flex items-center gap-1 transition-colors">
                                <Trash2 size={16}/> Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

           {isEditModalOpen && review && (
               <EditReviewModal 
                   review={review} 
                   onClose={() => setIsEditModalOpen(false)} 
                   onSave={handleUpdateReview} 
               />
           )}
        </div>
    );
};

export default ReviewPage;
