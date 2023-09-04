import { BaseMediaDocument } from './base-media-document';
import { GalleryCategory, MediaCollectionName } from '../../enums';
import { BaseDoc } from '../base/base-doc';
import { UserIdentityWithoutIds } from '../user/user-identity';

export class MediaWithoutIds extends BaseDoc {
    public _id: any;
    public collection: MediaCollectionName;
    public collectionId: any;
    public galleryCategory: GalleryCategory;
    public latest: BaseMediaDocument = null;
    public history: BaseMediaDocument[] = [];
    public thumbnail: BaseMediaDocument = null;
    public uploadedBy: UserIdentityWithoutIds = null;
    public isUploaded = true;

    constructor(params?: Partial<MediaWithoutIds>) {
        super(params);
        if (params) {
            this._id = params._id || this._id;
            this.collection = params.collection || this.collection;
            this.collectionId = params.collectionId || this.collectionId;
            this.galleryCategory = params.galleryCategory || this.galleryCategory;
            this.latest = params.latest
                ? new BaseMediaDocument(params.latest)
                : this.latest;
            this.history = params.history ? params.history.map(h => new BaseMediaDocument(h)) : this.history;
            this.thumbnail = params.thumbnail
                ? new BaseMediaDocument(params.thumbnail)
                : this.thumbnail;
            this.uploadedBy = params.uploadedBy
                ? new UserIdentityWithoutIds(params.uploadedBy)
                : this.uploadedBy;
            this.isUploaded = typeof params.isUploaded === 'boolean'
                ? params.isUploaded : this.isUploaded;
        }
    }
}
