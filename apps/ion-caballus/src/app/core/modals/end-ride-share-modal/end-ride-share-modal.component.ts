import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { scan, Subject, timer } from 'rxjs';
import { takeUntil, takeWhile } from 'rxjs/operators';

@Component({
  selector: 'app-end-ride-share-modal',
  templateUrl: './end-ride-share-modal.component.html',
  styleUrls: ['./end-ride-share-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EndRideShareModalComponent implements OnDestroy {
  public isModalClosed: boolean = false;
  private readonly _onDestroy$: Subject<void> = new Subject();

  public timer$ =
    timer(1, 1100).pipe(
      scan(acc => --acc, 11),
      takeWhile(x => x >= 0),
      takeUntil(this._onDestroy$)
    );

  constructor(private readonly _modalController: ModalController) {
    this.timer$.subscribe(counter => {
      if (counter === 0) {
        this.onCancel();
      }
    });
  }

  public async onSave(): Promise<void> {
    this._modalController.dismiss({
      share: true
    });
  }

  public onCancel(): void {
    if (this.isModalClosed) {
      return;
    }

    this.isModalClosed = true;
    this._modalController.dismiss({
      share: false
    });
  }

  public ngOnDestroy() {
    this._onDestroy$.next();
    this._onDestroy$.complete();
  }
}
