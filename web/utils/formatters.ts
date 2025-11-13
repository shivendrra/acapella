// FIX: Changed firebase imports to use the '@firebase' scope.
// FIX: Added FieldValue to handle server-side timestamps gracefully.
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

    // Check if the date is valid after conversion
    if (isNaN(dateObj.getTime())) {
        return '';
    }
    
    // en-GB locale provides the DD/MM/YYYY order, and the options format it as desired.
    const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    };
    
    return dateObj.toLocaleDateString('en-GB', options);
};