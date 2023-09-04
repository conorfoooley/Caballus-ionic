import { BehaviorSubject } from 'rxjs';

// token stream to hold the token which will be fetched from the query params
export const paramsStream = new BehaviorSubject<{ token: string, deepLink: string, subscriptionInvitationId?: string }>(null);
