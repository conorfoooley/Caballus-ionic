import { parseISODate } from "@rfx/common";
import { MediaCollectionName, MediaDocumentType, MediaSubjectType } from "@caballus/common";

export class MediaUploadItem {
  public mediaSubjectId = "";
  public uploadId: string;
  public uploadToken: string;
  public uploadLinks: string[];
  public jwPlayerId: string;
  public mediaId = "";
  public uploadCreatedAt: Date = new Date();
  public uploadedBytes = 0;
  public lastUploadedPart = -1;
  public fileSize = 0;
  public isSkipped = false;
  public isMediaCreatedOnBackend = false;
  public filePath = "";
  public fileName = "";
  public fileSizeInString: string;
  public uploadedFileSizeInString: string;
  public thumbnailUrl: string;
  public mediaType: MediaDocumentType = MediaDocumentType.Image;
  public mediaSubjectType: MediaSubjectType = MediaSubjectType.CurrentRideImage;
  public mediaCollectionName: MediaCollectionName = MediaCollectionName.Ride;

  constructor(params?: Partial<MediaUploadItem>) {
    if (params) {
      this.mediaSubjectId = params.mediaSubjectId || this.mediaSubjectId;
      this.uploadId = params.uploadId || this.uploadId;
      this.uploadToken = params.uploadToken || this.uploadToken;
      this.uploadLinks = params.uploadLinks || this.uploadLinks;
      this.lastUploadedPart = params.lastUploadedPart || this.lastUploadedPart;
      this.mediaId = params.mediaId || this.mediaId;
      this.jwPlayerId = params.jwPlayerId || this.jwPlayerId;
      this.uploadCreatedAt = params.uploadCreatedAt ? parseISODate(params.uploadCreatedAt) : this.uploadCreatedAt;
      this.uploadedBytes = params.uploadedBytes || this.uploadedBytes;
      this.fileSize = params.fileSize || this.fileSize;
      this.isMediaCreatedOnBackend = params.isMediaCreatedOnBackend || this.isMediaCreatedOnBackend;
      this.isSkipped = params.isSkipped || this.isSkipped;
      this.filePath = params.filePath || this.filePath;
      this.fileName = params.fileName || this.fileName;
      this.fileSizeInString = params.fileSizeInString || this.fileSizeInString;
      this.uploadedFileSizeInString = params.uploadedFileSizeInString || this.uploadedFileSizeInString;
      this.thumbnailUrl = params.thumbnailUrl || this.thumbnailUrl;
      this.mediaType = params.mediaType || this.mediaType;
      this.mediaSubjectType = params.mediaSubjectType || this.mediaSubjectType;
      this.mediaCollectionName = params.mediaCollectionName || this.mediaCollectionName;
    }
  }
}
