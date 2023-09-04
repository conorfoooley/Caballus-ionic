import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AlertController } from '@ionic/angular';
import { Share } from '@capacitor/share';
import { map, switchMap, take, tap, startWith, takeUntil, withLatestFrom } from 'rxjs/operators';
import { BehaviorSubject, combineLatest, from, Observable, Subject } from 'rxjs';
import {
    GalleryService,
    UserToHorseSummary,
    HorsePermission,
    BranchService
} from '@caballus/ui-common';
import { Select } from '@ngxs/store';
import { UserState } from '@caballus/ui-state';
import { HorseCache } from '@ion-caballus/core/caches';
import { environment } from '@ion-caballus/env';
import { PromptMsgModalComponent } from '../prompt-msg-modal/prompt-msg-modal.component';

import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
const PLACEHOLDER_IMAGE_URL = '/assets/images/horse-placeholder.png';
const FULLSCREEN_EL_ID = 'fullscreenpicture';
const DISMISS_FULLSCREEN_FN = (): void => document.getElementById(FULLSCREEN_EL_ID).remove();
declare var jwplayer: any;
@Component({
    selector: 'app-image-viewer',
    templateUrl: './image-viewer.component.html',
    styleUrls: ['./image-viewer.component.scss']
})
export class ImageViewer implements OnInit, OnDestroy {
    @Select(UserState.horseRelations)
    public horseRelations$: Observable<UserToHorseSummary[]>;
    public _showOnFullscreen$: Subject<void> = new Subject<void>();
    @Input() public attachmentUrl: string;
    public attachmentUrl$: BehaviorSubject<string | SafeResourceUrl> = new BehaviorSubject<
    string | SafeResourceUrl>(PLACEHOLDER_IMAGE_URL);
    public showFullImage: boolean = false;
    private _onDestroy$: Subject<void> = new Subject<void>();

    @Input() public mediaId: string;

    @Input() public horseId: string;

    @Input() public pinRemoveView: boolean;

    @Input() public onlyView: boolean;

    public canEdit$: Observable<boolean>;
    public urlSafe: SafeResourceUrl;
    constructor(
        private _modalCtrl: ModalController,
        private readonly _alertController: AlertController,
        private readonly _galleryService: GalleryService,
        private readonly _horseCache: HorseCache,
        private readonly _branchService: BranchService,
        private readonly _modalController: ModalController,
        private _domSanitizer: DomSanitizer
    ) { }

    ngOnInit(): void {
        this.canEdit$ = this.horseRelations$.pipe(
            take(1),
            map(relations => {
                const relation = !!relations
                    ? relations.find(r => r.horseIdentity._id === this.horseId)
                    : null;
                return !!relation
                    ? relation.horseRoleReference.permissions.includes(HorsePermission.HorseEdit)
                    : false;
            })
        );
        if (this.attachmentUrl) {
            this.attachmentUrl$.next(this.attachmentUrl);
          }
        this.urlSafe = this.getJWplayerUrl(this.attachmentUrl);
        this._showOnFullscreen$
            .pipe(
                takeUntil(this._onDestroy$),
                withLatestFrom(this.attachmentUrl$),
                tap(([_, url]) => {
                    const img: HTMLIonImgElement = document.createElement('ion-img');
                    img.id = FULLSCREEN_EL_ID;
                    img.src = url as string;
                    img.onclick = DISMISS_FULLSCREEN_FN;
                    img.style.position = 'fixed';
                    img.style.top = '0px';
                    img.style.bottom = '0px';
                    img.style.left = '0px';
                    img.style.right = '0px';
                    img.style.backgroundColor = 'gainsboro';
                    document.body.appendChild(img);
                })
            )
            .subscribe();
    }

    public ngOnDestroy(): void {
        this._onDestroy$.next();
        this._onDestroy$.complete();
      }

    public dismiss(value?: any): void {
        this._modalCtrl.dismiss(value);
    }

    public async showAlert(): Promise<void> {
        const buttons = [
            {
                text: 'Delete Media from this App',
                handler: (): void => {
                    this.deleteGalleryMedia(this.mediaId);
                }
            },
            {
                text: 'Keep Image',
                role: 'cancel'
            }
        ];

        const alert = await this._alertController.create({
            header: 'Select Option',
            cssClass: 'four-button-alert',
            buttons: [...buttons]
        });

        await alert.present();
    }

    private _promptMsgModal(): Observable<string> {
        const promise = this._modalController.create({
            cssClass: 'prompt-msg-modal',
            component: PromptMsgModalComponent
        });
        return from(promise).pipe(
            take(1),
            tap(m => m.present()),
            switchMap(m => from(m.onDidDismiss())),
            map(detail => detail.data)
        );
    }

    public onShare(attachmentUrl: string): void {
        combineLatest([this._promptMsgModal(), this._horseCache.getHorse(this.horseId)])
            .pipe(
                tap(async ([msg, horse]) => {
                    const route = `/tabs/horse-profile/detail-horse/general-tab/${horse._id}`;
                    const desktopUrl = `${environment.ionBaseUrl}/${route}`;
                    const description = [
                        `${msg && msg.trim().length ? msg : 'Photo taken with Caballus'}`
                    ].join('\n');
                    const title = `Photo with ${horse.profile.commonName}`;
                    const shareUrl = `${environment.webserver}/horse/profile/share?id=${this.horseId
                        }&title=${encodeURIComponent(title)}&image=${encodeURIComponent(
                            attachmentUrl
                        )}&description=${encodeURIComponent(
                            description
                        )}&desktopUrl=${encodeURIComponent(desktopUrl)}`;
                    const deeplink = await this._branchService.generateNewDeepLink(
                        shareUrl,
                        `/tabs/horse-profile/detail-horse/general-tab/${horse._id}`
                    );
                    Share.share({
                        title,
                        text: description,
                        url: deeplink,
                        dialogTitle: title
                    });
                })
            )
            .subscribe();
    }

    public toggleFullImage(): void {
        this._showOnFullscreen$.next();
    }

    public deleteGalleryMedia(mediaId): void {
        this._galleryService
            .deleteGalleryMedia({ horseId: this.horseId, mediaId: mediaId })
            .subscribe(() => {
                this.dismiss();
            });
    }

    public pinMedia(): void {
        this._galleryService
            .pinMedia({ horseId: this.horseId, mediaToPin: this.mediaId })
            .subscribe(() => {
                this.dismiss();
            });
    }

    public removePin(): void {
        this._galleryService
            .unpinMedia({ horseId: this.horseId, mediaToUnpinId: this.mediaId })
            .subscribe(() => {
                this.dismiss();
            });
    }
    public isVideoUrl(url: string): boolean {
        return url.includes('videos');
    }
    public getJWplayerUrl(jwPlayerId) {
        return this._domSanitizer.bypassSecurityTrustResourceUrl(jwPlayerId);
    }
}
