import { BaseMediaDocument } from '../media/base-media-document';

export class ConnectionIdentityWithoutIds {
    public _id: any;
    public displayName: string = '';
    public profileUrl: string = '';
    public profilePicture: BaseMediaDocument = null;
    public profilePublic: boolean = false;

    constructor(params?: Partial<ConnectionIdentityWithoutIds>) {
        if (!!params) {
            this._id = params._id || this._id;
            this.displayName = params.displayName || this.displayName;
            this.profileUrl = params.profileUrl || this.profileUrl;
            this.profilePicture = !!params.profilePicture
                ? new BaseMediaDocument(params.profilePicture)
                : this.profilePicture;
            this.profilePublic = params.profilePublic || this.profilePublic;
        }
    }
}
