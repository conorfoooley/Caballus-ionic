import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil, tap, withLatestFrom } from 'rxjs/operators';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

const PLACEHOLDER_IMAGE_URL = '/assets/images/horse-placeholder.png';
const FULLSCREEN_EL_ID = 'fullscreenpicture';
const DISMISS_FULLSCREEN_FN = (): void => document.getElementById(FULLSCREEN_EL_ID).remove();
declare var jwplayer: any;

@Component({
  selector: 'app-media-preview-modal',
  templateUrl: './media-preview-modal.component.html',
  styleUrls: ['./media-preview-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MediaPreviewModalComponent implements OnInit, OnDestroy {
  @Input() public title!: string;
  @Input() public attachmentUrl!: string | SafeResourceUrl;
  @Input() public isVideo!: boolean;
  @Input() public action!: string;
  @Input() public jwPlayerId!: string;

  private _onDestroy$: Subject<void> = new Subject<void>();
  public _showOnFullscreen$: Subject<void> = new Subject<void>();

  public attachmentUrl$: BehaviorSubject<string | SafeResourceUrl> = new BehaviorSubject<
    string | SafeResourceUrl>(PLACEHOLDER_IMAGE_URL);
  public action$: BehaviorSubject<string> = new BehaviorSubject<string>('Close');
  public title$: BehaviorSubject<string> = new BehaviorSubject<string>('Preview');
  public urlSafe: SafeResourceUrl;

  constructor(private readonly _modalController: ModalController, private _domSanitizer: DomSanitizer) {
  }

  public ngOnInit(): void {
    if (this.attachmentUrl) {
      this.attachmentUrl$.next(this.attachmentUrl);
    }

    if (this.action) {
      this.action$.next(this.action);
    }

    if (this.title) {
      this.title$.next(this.title);
    }

    // initialize JWPlayer when jwPlayerId is available
    if (!!this.jwPlayerId) {
      this.urlSafe = this.getJWplayerUrl(this.jwPlayerId);
    }

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

  public accept(): void {
    this.dismissModal(true);
  }

  public dismissModal(confirm: boolean = false): void {
    this._modalController.dismiss(confirm);
  }

  public showOnFullscreen(): void {
    this._showOnFullscreen$.next();
  }

  public getJWplayerUrl(jwPlayerId) {
    return this._domSanitizer.bypassSecurityTrustResourceUrl(
      'https://content.jwplatform.com/players/' + jwPlayerId + '.html'
    );
  }
}
