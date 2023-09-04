import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Subject } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';


declare var jwplayer: any;

@Component({
  selector: 'app-video-viewer',
  templateUrl: './video-viewer-modal.component.html',
  styleUrls: ['./video-viewer-modal.component.scss']
})
export class VideoViewerModalComponent implements OnInit, OnDestroy {
  @Input() public jwPlayerId: string;
  private _onDestroy$: Subject<void> = new Subject<void>();

  constructor(private _modalCtrl: ModalController, private _sanitizer: DomSanitizer) {
  }

  ngOnInit(): void {
    jwplayer('player').setup({
      title: 'Ride Media',
      playlist: `https://cdn.jwplayer.com/v2/media/${this.jwPlayerId}`,
      mute: true,
      autostart: true,
      primary: 'html5',
      stretching: 'full'
    });
  }

  public dismiss(value?: any): void {
    this._modalCtrl.dismiss(value);
  }

  public ngOnDestroy(): void {
    this._onDestroy$.next();
    this._onDestroy$.complete();
  }
}
