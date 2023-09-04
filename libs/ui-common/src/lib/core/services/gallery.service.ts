import { HttpService, Get, Put, Query, Body, Post } from '@rfx/ngx-http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Media } from '../models';
import { GallerySortByOption, MediaDocumentType } from '@caballus/common';
import * as jsonToFormData from 'json-form-data';

export interface PinMediaDto {
    horseId: string;
    mediaToPin: string;
    pinnedMediaToReplace?: string;
}
export interface UnpinMediaDto {
    horseId: string;
    mediaToUnpinId: string;
}
export interface DeleteGalleryMediaDto {
    horseId: string;
    mediaId: string;
}

@Injectable({ providedIn: 'root' })
export class GalleryService extends HttpService {
    @Get('/gallery/pinned')
    public getPinnedMediaByHorseId(@Query('id') id: string): Observable<Media[]> {
        return null;
    }

    @Put('/gallery/pin')
    public pinMedia(@Body() dto: PinMediaDto): Observable<void> {
        return null;
    }

    @Put('/gallery/pinned/remove')
    public unpinMedia(@Body() dto: UnpinMediaDto): Observable<void> {
        return null;
    }

    @Post('/gallery/list')
    public getHorseGalleryMedia(
        @Body('ids') horseId: string[],
        @Body('mediaType') mediaType?: MediaDocumentType,
        @Body('sortOption') sortOption?: GallerySortByOption
    ): Observable<Media[]> {
        return null;
    }

   /*  public getMediaInfoJW(jwPlayerId: string): Observable<JSON> {
        let jsonData = this._http.get<JSON>(`https://cdn.jwplayer.com/v2/media/${jwPlayerId}`);
        (jsonData.subscribe(res=>{
            console.log({res})
        }))
        return jsonData;
    } */
    public uploadImageToHorseProfile(horseId: string, imageBlob: Blob): Observable<void> {
        const formData = jsonToFormData({ id: horseId });
        formData.append('file', imageBlob);
        return this._http.post<void>('/horse/profilePicture', formData);
    }

    public uploadImageToHorseGallery(
        horseId: string,
        imageId: string,
        imageBlob: Blob
    ): Observable<void> {
        const formData = jsonToFormData({ id: horseId, imageId });
        formData.append('image', imageBlob);
        return this._http.post<void>('/gallery', formData);
    }

    /*
        The delete() method of Angular's HttpClient class
        does not directly support attaching a request body,
        so we need to use the request() method directly instead.

        Pat D Nov 1 2021
    */
    public deleteGalleryMedia(dto: DeleteGalleryMediaDto): Observable<void> {
        return this._http.request<void>('delete', '/gallery', {
            headers: {
                'Content-Type': 'application/json'
            },
            body: dto
        });
    }
}
