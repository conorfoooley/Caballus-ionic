import { BaseMediaDocument } from '../media/base-media-document';
import { HorseConnectionSimple } from './horse-connection-simple';

export class HorseOwnerSimple extends HorseConnectionSimple {
    public profilePicture: BaseMediaDocument;

    constructor(params?: Partial<HorseOwnerSimple>) {
        super(params);
        if (!!params) {
            this.profilePicture = !!params.profilePicture
                ? new BaseMediaDocument(params.profilePicture)
                : this.profilePicture;
        }
    }
}
