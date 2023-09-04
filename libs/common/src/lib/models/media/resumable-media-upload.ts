export class ResumableMediaUpload {
  public uploadId: string;
  public uploadToken: string;
  public uploadLinks: string[];
  public jwPlayerId: string = '';

  constructor(params?: Partial<ResumableMediaUpload>) {
    if (!!params) {
      this.uploadId = params.uploadId || this.uploadId;
      this.uploadToken = params.uploadToken || this.uploadToken;
      this.uploadLinks = params.uploadLinks || this.uploadLinks;
      this.jwPlayerId = params.jwPlayerId || this.jwPlayerId;
    }
  }
}
