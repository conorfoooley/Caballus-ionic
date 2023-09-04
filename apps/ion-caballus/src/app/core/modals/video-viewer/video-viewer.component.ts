import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Subject } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { takeUntil, tap } from 'rxjs/operators';

const FULLSCREEN_EL_ID = 'fullscreenpicture';
const DISMISS_FULLSCREEN_FN = (): void => document.getElementById(FULLSCREEN_EL_ID).remove();

@Component({
    selector: 'app-video-viewer',
    templateUrl: './video-viewer.component.html',
    styleUrls: ['./video-viewer.component.scss']
})
export class VideoViewer implements OnInit, OnDestroy {
    @Input() public attachmentUrl: string;
    public urlSafe: SafeResourceUrl;
    public _showOnFullscreen$: Subject<void> = new Subject<void>();
    private _onDestroy$: Subject<void> = new Subject<void>();

    constructor(private _modalCtrl: ModalController, private _sanitizer: DomSanitizer) {}

    ngOnInit(): void {
        this.urlSafe = this._sanitizer.bypassSecurityTrustUrl(this.attachmentUrl);

        this._showOnFullscreen$
            .pipe(
                takeUntil(this._onDestroy$),
                tap(() => {
                    const img: HTMLIonImgElement = document.createElement('ion-img');
                    img.id = FULLSCREEN_EL_ID;
                    img.src = this.attachmentUrl;
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

    public dismiss(value?: any): void {
        this._modalCtrl.dismiss(value);
    }

    public showOnFullscreen(): void {
        this._showOnFullscreen$.next();
    }

    public ngOnDestroy(): void {
        this._onDestroy$.next();
        this._onDestroy$.complete();
    }
}
