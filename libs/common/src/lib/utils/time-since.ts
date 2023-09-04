import moment from 'moment';

export function timeSince(eventDate: Date, toDate: Date = new Date()): string {
    const event = moment(eventDate);
    const compareTo = moment(toDate);
    const SECONDS_BEFORE_ONE_MINUTE: number = 59;
    const secondsPassed = compareTo.diff(event, 'seconds');
    if (!event.isValid() || !compareTo.isValid || event.isAfter(compareTo)) {
        return '';
    } else if (secondsPassed < SECONDS_BEFORE_ONE_MINUTE) {
        return 'Just Now';
    } else {
        return event.from(compareTo);
    }
}
