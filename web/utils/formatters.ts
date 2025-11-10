import { Timestamp, FieldValue } from '@firebase/firestore';

export const formatDate = (date: Date | Timestamp | FieldValue | string | null | undefined): string => {
  if (!date) return '';

  let dateObj: Date;
  if (date instanceof Timestamp) {
    dateObj = date.toDate();
  } else if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (date instanceof Date) {
    dateObj = date;
  } else {
    return '';
  }

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  };

  return dateObj.toLocaleDateString('en-GB', options);
};