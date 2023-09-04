import { UserBillingWithoutIds } from '@caballus/common';
import { UserProfile } from './user-profile';

export class UserBilling extends UserBillingWithoutIds {
    public payingUser: UserProfile;

    constructor(params: Partial<UserBilling>) {
        super(params);
        if (!!params) {
            this.payingUser = new UserProfile(params.payingUser) ?? this.payingUser;
        }
    }
}
