export const calcTimeDiff = (startTime, endTime, type = 'day') => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffInMs = end - start;
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    switch (type) {
        case 'day':
            return Math.floor(diffInDays);
        case 'month':
            return Math.floor(diffInDays / 30);
        case 'year':
            return Math.floor(diffInDays / 365);
        default:
            return Math.floor(diffInDays);
    }
};