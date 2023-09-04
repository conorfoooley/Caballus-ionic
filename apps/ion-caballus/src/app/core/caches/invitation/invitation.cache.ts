import { Injectable } from '@angular/core';
import { StorageService } from '../../services/storage.service';
import { CapacitorPluginService } from '../../services/capacitor-plugin.service';
import { Observable, of, from, forkJoin, throwError } from 'rxjs';
import { take, switchMap, map, tap, share, catchError } from 'rxjs/operators';
import {
    Invitation,
    InvitationService,
    InvitationDto,
    User,
    UserProfileDto,
    FriendService, FriendRequestDto
} from '@caballus/ui-common';
import { GeneralInvitationDto } from 'libs/ui-common/src/lib/core/services/invitation.service';

enum Keys {
    SentOwnershipTransferInvitations = 'invitations-ownership-transfer-sent-'
}

export { Keys as InvitationCacheKeys };

@Injectable({ providedIn: 'root' })
export class InvitationCache {
    private _currentSentOwnershipTransferInvitationsDownload$: Observable<Invitation[]> = null;

    constructor(
        private readonly _storageService: StorageService,
        private readonly _invitationService: InvitationService,
        private readonly _friendService: FriendService,
        private readonly _capacitorPluginService: CapacitorPluginService
    ) {}

    public sync(): Observable<[Invitation[]]> {
        return this._capacitorPluginService
            .networkStatus()
            .pipe(
                switchMap(network =>
                    !network.connected
                        ? of(undefined)
                        : forkJoin([this._syncSentOwnershipTransferInvitationsCache()])
                )
            );
    }

    private _parseInvitations(json: string): Invitation[] {
        const parsed = JSON.parse(json);
        return Array.isArray(parsed) ? parsed.map(e => new Invitation(e)) : [];
    }

    /*
        Ownership transfer invitations
    */

    public createOwnershipTransferInvitation(dto: InvitationDto): Observable<string> {
        return this._capacitorPluginService
            .networkStatus()
            .pipe(
                switchMap(network =>
                    !network.connected
                        ? throwError('Network unavailable')
                        : this._invitationService.createOwnershipTransferInvitation(dto)
                )
            );
    }

    public retractOwnershipTransferInvitation(horseId: string): Observable<void> {
        return this._capacitorPluginService
            .networkStatus()
            .pipe(
                switchMap(network =>
                    !network.connected
                        ? throwError('Network unavailable')
                        : this._invitationService.retractOwnershipTransferInivtation(horseId)
                )
            );
    }

    public getSentOwnershipTransferInvitations(): Observable<Invitation[]> {
        return this._capacitorPluginService
            .networkStatus()
            .pipe(
                switchMap(networkStatus =>
                    networkStatus.connected
                        ? this._syncSentOwnershipTransferInvitationsCache()
                        : this._cachedSentOwnershipTransferInvitations()
                )
            );
    }

    private _syncSentOwnershipTransferInvitationsCache(): Observable<Invitation[]> {
        if (!this._currentSentOwnershipTransferInvitationsDownload$) {
            this._currentSentOwnershipTransferInvitationsDownload$ = this._downloadSentOwnershipTransferInvitations().pipe(
                tap(() => (this._currentSentOwnershipTransferInvitationsDownload$ = null)),
                share()
            );
        }
        return this._currentSentOwnershipTransferInvitationsDownload$;
    }

    private _downloadSentOwnershipTransferInvitations(): Observable<Invitation[]> {
        return this._invitationService.getSentOwnershipTransferInvitations().pipe(
            switchMap(invitations =>
                from(
                    this._storageService.setUserData(
                        Keys.SentOwnershipTransferInvitations,
                        JSON.stringify(invitations)
                    )
                ).pipe(map(() => invitations))
            ),
            catchError(err => {
                console.error(err);
                return of(void 0);
            })
        );
    }

    private _cachedSentOwnershipTransferInvitations(): Observable<Invitation[]> {
        return from(this._storageService.getUserData(Keys.SentOwnershipTransferInvitations)).pipe(
            map(json => this._parseInvitations(json))
        );
    }

    public createGeneralInvitation(dto: GeneralInvitationDto): Observable<string> {
        return this._capacitorPluginService
            .networkStatus()
            .pipe(
                switchMap(network =>
                    !network.connected
                        ? throwError('Network unavailable')
                        : this._invitationService.createGeneralInvitation(dto)
                )
            );
    }

    public retractGeneralInvitation(horseId: string): Observable<void> {
        return this._capacitorPluginService
            .networkStatus()
            .pipe(
                switchMap(network =>
                    !network.connected
                        ? throwError('Network unavailable')
                        : this._invitationService.retractGeneralInvitation(horseId)
                )
            );
    }

    public getInvitationDetailedListByHorseId(
        horseId: string,
        includeOwner?: boolean,
        onlySent?: boolean
    ): Observable<Invitation[]> {
      return new Observable((observer) => {
        this._invitationService.getInvitationDetailedListByHorseId(horseId, includeOwner, onlySent).pipe(
            take(1),
            tap((invitations) => observer.next(invitations)),
            catchError(err => {
                observer.next([])
                console.error('Error while fetching invitations', err)
                return of([])
            })
        ).subscribe();
      })
    }

    public subscriptionTransfer(user: UserProfileDto): Observable<string> {
        return this._capacitorPluginService
            .networkStatus()
            .pipe(
                switchMap(network =>
                    !network.connected
                        ? throwError('Network unavailable')
                        : this._invitationService.subscriptionTransfer(user)
                )
            );
    }

    public friendRequest(user: FriendRequestDto): Observable<string> {
        return this._capacitorPluginService
            .networkStatus()
            .pipe(
                switchMap(network =>
                    !network.connected
                        ? throwError('Network unavailable')
                        : this._invitationService.friendRequest(user)
                ),
            );
    }
}

