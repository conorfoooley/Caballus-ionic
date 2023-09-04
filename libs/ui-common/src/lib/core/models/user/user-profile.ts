import { UserProfileWithoutIds } from '@caballus/common';

export class UserProfile extends UserProfileWithoutIds {
    public _id: any = '';

    constructor(params?: Partial<UserProfile>) {
        super(params);
        if (!!params) {
            this._id = params._id || this._id;
        }
    }
}
