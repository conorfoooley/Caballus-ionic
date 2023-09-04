import { UserWithoutIds, Permission } from '@caballus/common';
import { ObjectId, parseObjectIdList, parseObjectId } from '@rfx/nst-db/mongo';
import { UserIdentity } from './user-identity';
import { UserBilling } from './user-billing';

export class User extends UserWithoutIds {
    public _id: ObjectId = new ObjectId();
    public roleIds: ObjectId[] = [];

    // This field is only set when the object is gotten from the @LoggedInUser
    // decorator
    public permissions?: Permission[] = [];
    public billing: UserBilling;

    constructor(params?: Partial<User>) {
        super(params);
        if (!!params) {
            this._id = params._id || this._id;
            this.roleIds = Array.isArray(params.roleIds)
                ? parseObjectIdList(params.roleIds)
                : this.roleIds;
            this.billing = !!params.billing ? new UserBilling(params.billing) : this.billing;
        }
    }

    public toIdentity(): UserIdentity {
        return new UserIdentity({
            _id: this._id,
            label: `${this.profile.firstName} ${this.profile.lastName}`,
            picture: this.profile.profilePicture
        });
    }
}
