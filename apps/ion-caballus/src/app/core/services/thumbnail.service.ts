import { Injectable } from '@angular/core';
import { Photo } from '@capacitor/camera';
import { from, Observable, of, Subject, Subscriber, Subscription } from 'rxjs';
import { map, takeUntil, tap, switchMap, take } from 'rxjs/operators';
import { Video } from '@caballus/ui-common';
import { DomSanitizer } from '@angular/platform-browser';

@Injectable({
    providedIn: 'root'
})
export class ThumbnailService {
    constructor(private readonly _sanitizer: DomSanitizer) {}

    public base64ToDataUrl(photo: Photo): string {
        return `data:image/${photo.format || 'jpeg'};base64,${photo.base64String}`;
    }

    public getPhotoThumbnail(photo: Photo, height: number, width: number): Observable<string> {
        return new Observable((subscriber: Subscriber<string>): (() => void) => {
            const onComplete: Subject<void> = new Subject();

            let image = new Image();

            let canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            image.onload = (): Subscription =>
                of(undefined)
                    .pipe(
                        takeUntil(onComplete),
                        tap(() => {
                            canvas.getContext('2d').drawImage(image, 0, 0, width, height);
                        }),
                        map(() => canvas.toDataURL())
                    )
                    .subscribe(thumbnail => subscriber.next(thumbnail));
            image.src = photo.base64String ? this.base64ToDataUrl(photo) : photo.dataUrl;

            return (): void => {
                image = undefined;
                canvas = undefined;
                onComplete.next();
                onComplete.complete();
            };
        });
    }

    public getVideoThumbnail(v: Video, height: number, width: number): Observable<string> {
        return new Observable((subscriber: Subscriber<string>): (() => void) => {
            const onComplete: Subject<void> = new Subject();
            let canvas = document.createElement('canvas');
            let video = document.createElement('video');
            video.style.display = 'none';
            canvas.style.display = 'none';

            canvas.width = width;
            canvas.height = height;
            // // this is important
            video.autoplay = true;
            video.muted = true;
            video.preload = 'metadata';

            const ctx = canvas.getContext('2d');

            v.blob().then(file => {
                video.onloadeddata = (): Subscription =>
                    of(file)
                        .pipe(
                            take(1),
                            takeUntil(onComplete),
                            tap(() => {
                                video.currentTime = 0.2;

                                canvas.width = video.videoWidth;
                                canvas.height = video.videoHeight;

                                ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                            }),
                            map(() => canvas.toDataURL('image/png'))
                        )
                        .subscribe(
                            thumbnail => {
                                video.pause();
                                const urls = {
                                    thumbnailDataUrl: thumbnail,
                                    dataUrl: URL.createObjectURL(file as File)
                                };
                                subscriber.next(JSON.stringify(urls));
                            },
                            error => {
                                console.log('thumbnail error', error);
                            }
                        );

                video.src = URL.createObjectURL(new Blob([file], { type: 'video/mp4' }));
                video.onerror = (event, source, lineno, colno, error) => {
                    console.log('thumbnail video load error', error);
                };
                return '';
            });
            return (): void => {
                video = undefined;
                canvas = undefined;
                onComplete.next();
                onComplete.complete();
            };
        });
    }
}
