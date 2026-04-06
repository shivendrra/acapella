import { Timestamp, FieldValue } from '@firebase/firestore';

export const formatDate = (
  date: string | Timestamp | FieldValue | null | undefined
): string => {
  if (!date) return '';

  if (date instanceof Timestamp) {
    return date
      .toDate()
      .toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
  }

  // If it's a Firestore FieldValue (serverTimestamp placeholder)
  if (typeof date === 'object') {
    return '';
  }

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};