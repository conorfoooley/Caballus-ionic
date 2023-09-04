import { BaseMediaDocument } from '../media/base-media-document';

export class IdentityWithoutIds {
    public _id: any;
    public label: string = '';
    public picture: BaseMediaDocument;

    constructor(params?: Partial<IdentityWithoutIds>) {
        if (!!params) {
            this._id = params._id || this._id;
            this.label = params.label || this.label;
            this.picture = !!params.picture ? new BaseMediaDocument(params.picture) : this.picture;
        }
    }
}
