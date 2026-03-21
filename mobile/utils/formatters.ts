import { Timestamp } from '@firebase/firestore';

export const formatDate = (date: string | Timestamp | null | undefined): string => {
  if (!date) return '';
  if (date instanceof Timestamp) {
    return date.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};