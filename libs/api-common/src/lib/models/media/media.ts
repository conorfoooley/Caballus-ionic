import { MediaWithoutIds } from '@caballus/common';
import { ObjectId, parseObjectId } from '@rfx/njs-db/mongo/src';
import { UserIdentity } from '../user/user-identity';

export class Media extends MediaWithoutIds {
    public _id: ObjectId;
    public collectionId: ObjectId;
    public uploadedBy: UserIdentity;

    constructor(params?: Partial<Media>) {
        super(params);
        if (!!params) {
            this._id = !!params._id ? parseObjectId(params._id) : this._id;
            this.collectionId = !!params.collectionId ? parseObjectId(params.collectionId) : this.collectionId;
            this.uploadedBy = !!params.uploadedBy
                ? new UserIdentity(params.uploadedBy)
                : this.uploadedBy;
        }
    }
}
