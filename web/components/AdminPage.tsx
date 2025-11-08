

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, doc, updateDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { Role, AdminApplication } from '../types';

interface ApplicationWithId extends AdminApplication {
  docId: string;
}

const AdminDashboard: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold font-serif mb-4">Content Management</h2>
      <p>Here you can add, edit, or remove songs, albums, and artists from the database.</p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
          <h3 className="font-semibold">Manage Songs</h3>
          <button className="mt-2 px-4 py-2 text-sm bg-ac-primary text-white rounded-md">Go</button>
        </div>
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
          <h3 className="font-semibold">Manage Albums</h3>
          <button className="mt-2 px-4 py-2 text-sm bg-ac-primary text-white rounded-md">Go</button>
        </div>
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
          <h3 className="font-semibold">Manage Artists</h3>
          <button className="mt-2 px-4 py-2 text-sm bg-ac-primary text-white rounded-md">Go</button>
        </div>
      </div>
    </div>
  );
}

const ApplicationReview: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "adminApplications"), where("status", "==", "pending"));
      const querySnapshot = await getDocs(q);
      const pendingApps = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() } as ApplicationWithId));
      setApplications(pendingApps);
    } catch (err) {
      setError("Failed to fetch applications.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleApplication = async (app: ApplicationWithId, newStatus: 'approved' | 'rejected') => {
    try {
      const batch = writeBatch(db);

      // Update application status
      const appRef = doc(db, "adminApplications", app.docId);
      batch.update(appRef, { status: newStatus });

      // If approved, update user role
      if (newStatus === 'approved') {
        const userRef = doc(db, "users", app.userId);
        batch.update(userRef, { role: Role.ADMIN });
      }

      await batch.commit();

      // Refresh list
      fetchApplications();

    } catch (err) {
      setError(`Failed to ${newStatus === 'approved' ? 'approve' : 'reject'} application.`);
      console.error(err);
    }
  };

  if (loading) return <div>Loading applications...</div>;
  if (error) return <div className="text-ac-danger">{error}</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold font-serif mb-4">Admin Applications</h2>
      {applications.length === 0 ? (
        <p>No pending applications.</p>
      ) : (
        <div className="space-y-4">
          {applications.map(app => (
            <div key={app.docId} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{app.userName || app.userEmail}</p>
                  <p className="text-sm text-gray-500">{app.userEmail}</p>
                </div>
                <div className="text-sm text-gray-400">
                  {/*// FIX: Safely access timestamp by checking if it's an instance of Timestamp.*/}
                  {app.submittedAt instanceof Timestamp && app.submittedAt.toDate().toLocaleDateString()}
                </div>
              </div>
              <p className="mt-4 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">{app.reason}</p>
              <div className="mt-4 flex space-x-2">
                <button onClick={() => handleApplication(app, 'approved')} className="px-3 py-1 text-sm bg-ac-secondary text-white rounded-md hover:bg-ac-secondary/90">Approve</button>
                <button onClick={() => handleApplication(app, 'rejected')} className="px-3 py-1 text-sm bg-ac-danger text-white rounded-md hover:bg-ac-danger/90">Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


export const AdminPage: React.FC = () => {
  const { userProfile } = useAuth();

  return (
    <div>
      <h1 className="text-4xl font-bold font-serif mb-8">Admin Panel</h1>
      {userProfile?.role === Role.MASTER_ADMIN && (
        <div className="mb-12">
          <ApplicationReview />
        </div>
      )}

      {(userProfile?.role === Role.ADMIN || userProfile?.role === Role.MASTER_ADMIN) && (
        <div>
          <AdminDashboard />
        </div>
      )}
    </div>
  );
};