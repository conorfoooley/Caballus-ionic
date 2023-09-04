import { MediaDocumentType } from '../../enums';
import { SafeResourceUrl } from '@angular/platform-browser';

export class BaseMediaDocument {
    public path: string = '';
    public name: string = '';
    public type: MediaDocumentType = null;
    public dateUploaded: Date;
    public jwPlayerId: string = '';

    // signed storage bucket url delivered from api to fronted
    public url: string = '';
    // trusted url configured by mobile disk retrieval for rendering in UI
    public safeUrl: SafeResourceUrl;

    constructor(params?: Partial<BaseMediaDocument>) {
        if (!!params) {
            this.path = params.path || this.path;
            this.name = params.name || this.name;
            this.type = params.type || this.type;
            this.dateUploaded = params.dateUploaded || this.dateUploaded;
            this.jwPlayerId = params.jwPlayerId || this.jwPlayerId;

            this.url = params.url || this.url;
            this.safeUrl = params.safeUrl || this.safeUrl;
        }
    }
}
