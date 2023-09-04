import { GalleryCategory, MediaDocumentType, MediaSubjectType, MediaWithoutIds } from '@caballus/common';
import { UserIdentity } from '../user/user-identity';
import { SafeResourceUrl } from '@angular/platform-browser';

export class Media extends MediaWithoutIds {
    public _id: string;
    public collectionId: string;
    public uploadedBy: UserIdentity;

    constructor(params?: Partial<Media>) {
        super(params);
        if (!!params) {
            this._id = params._id || this._id;
            this.collectionId = params.collectionId || this.collectionId;
            this.uploadedBy = !!params.uploadedBy
                ? new UserIdentity(params.uploadedBy)
                : this.uploadedBy;
        }
    }
}

export interface MediaMetadata {
    mediaSubjectId: string;
    mediaId: string;
    galleryCategory?: GalleryCategory;
    mediaType?: MediaDocumentType;
    mediaSubjectType?: MediaSubjectType;
    filePath?: string;
    fileSize?: number;
}

export interface MediaData extends MediaMetadata {
    dataUrl?: string;
    safeUrl?: SafeResourceUrl;
    thumbnailDataUrl?: string;
}
