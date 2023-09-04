import { Injectable } from '@angular/core';
import { HorseCache } from '../caches/horse/horse.cache';
import { RideCache } from '../caches/ride/ride.cache';
import { InvitationCache } from '../caches/invitation/invitation.cache';
import { MediaCache } from '../caches/media/media.cache';
import { Observable, forkJoin, of } from 'rxjs';
import {
    take,
    tap,
    switchMap,
    switchMapTo,
    mapTo,
    mergeMap,
    zip,
    catchError
} from 'rxjs/operators';
import { MediaUploadQueueService } from '@ion-caballus/core/services/media-upload-queue.service';

@Injectable({ providedIn: 'root' })
export class CacheService {
    constructor(
        private readonly _horseCache: HorseCache,
        private readonly _rideCache: RideCache,
        private readonly _invitationCache: InvitationCache,
        private readonly _mediaCache: MediaCache,
        private readonly _mediaUploadQueueService: MediaUploadQueueService
    ) {}

    public sync(): Observable<void> {
        return this._horseCache.sync().pipe(
            take(1),
            switchMap(() =>
                forkJoin([
                    this._rideCache.sync().pipe(
                        take(1),
                        catchError(e => {
                            console.log(e);
                            return of(e);
                        })
                    ),
                    this._invitationCache.sync().pipe(
                        take(1),
                        catchError(e => {
                            console.log(e);
                            return of(e);
                        })
                    ),
                    this._mediaCache.sync().pipe(
                        take(1),
                        catchError(e => {
                            console.log(e);
                            return of(e);
                        })
                    )
                ])
            ),
            mapTo(undefined),
            catchError(e => {
                console.log(e);
                return of(e);
            })
        );
    }
}
