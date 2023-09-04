import { UserProfileWithoutIds } from './user-profile';

export class UserBillingWithoutIds {
    public customerId: string;
    public subscription: any;
    public payingUser: UserProfileWithoutIds;

    constructor(params: Partial<UserBillingWithoutIds>) {
        if (!!params) {
            this.customerId = params.customerId ?? this.customerId;
            this.subscription = params.subscription ?? this.subscription;
            this.payingUser = new UserProfileWithoutIds(params.payingUser) ?? this.payingUser;
        }
    }
}
