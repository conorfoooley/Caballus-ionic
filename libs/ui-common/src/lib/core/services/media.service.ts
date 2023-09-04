import { Injectable } from '@angular/core';
import { Body, HttpService, Post } from '@rfx/ngx-http';
import { Observable } from 'rxjs';
import { Media } from '../models';
import {
  MediaCollectionName,
  MediaDocumentType,
  ResumableMediaUpload,
} from '@caballus/common';
import * as jsonToFormData from 'json-form-data';

@Injectable({
  providedIn: 'root',
})
export class MediaService extends HttpService {
  public createMedia(
    mediaId: string,
    mediaSubjectId: string,
    thumbnail: Blob,
    mediaType: MediaDocumentType,
    collectionName: MediaCollectionName,
    filePath?: string
  ): Observable<Media> {
    const formData = jsonToFormData({
      id: mediaId,
      mediaSubjectId,
      mediaType,
      collectionName,
      filePath,
    });
    formData.append('thumbnail', thumbnail);
    return this._http.post<Media>('/media/create-media', formData);
  }

  @Post('/media/initiate-resumable-upload')
  public initiateResumableUpload(
    @Body('contentLength') contentLength: number
  ): Observable<ResumableMediaUpload> {
    return null;
  }

  @Post('/media/complete-resumable-upload')
  public completeResumableUpload(
    @Body('uploadId') uploadId: string,
    @Body('uploadToken') uploadToken: string,
    @Body('id') id: string,
    @Body('jwPlayerId') jwPlayerId: string
  ): Observable<void> {
    return null;
  }

  @Post('/media/refresh-upload-links')
  public refreshUploadLinks(
    @Body('uploadId') uploadId: string,
    @Body('uploadToken') uploadToken: string,
    @Body('contentLength') contentLength: number
  ): Observable<Array<string>> {
    return null;
  }

  public completeImageUpload(
    mediaId: string,
    imageBlob: Blob
  ): Observable<Media> {
    const formData = jsonToFormData({ mediaId });
    formData.append('image', imageBlob);
    return this._http.post<Media>('/media/complete-image-upload', formData);
  }

  @Post('/media/get-media-by-id')
  public getMediaById(@Body('id') id: string): Observable<Media> {
    return null;
  }
}
