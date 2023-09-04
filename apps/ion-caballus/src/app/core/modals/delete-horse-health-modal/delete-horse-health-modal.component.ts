import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';
import { ToastService } from '@rfx/ngx-toast';
import { HorseCache } from '../../caches/horse/horse.cache';
import { ModalController } from '@ionic/angular';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, finalize, take, tap } from 'rxjs/operators';

@Component({
    selector: 'app-delete-horse-health-modal',
    templateUrl: './delete-horse-health-modal.component.html',
    styleUrls: ['./delete-horse-health-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeleteHorseHealthModalComponent implements OnInit {
    @Input()
    public horseHealthId!: string;
    @Input()
    public horseId!: string;
    public isDeleting$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    constructor(
        private readonly _modalController: ModalController,
        private readonly _horseCache: HorseCache,
        private readonly _toastService: ToastService
    ) {}

    public ngOnInit(): void {
    }

    public deleteHorseHeath(): void {
        this.isDeleting$.next(true);
        this._horseCache.deleteHorseHealth(this.horseHealthId, this.horseId).pipe(
            take(1),
            tap(() => this._modalController.dismiss({
                deleted: true
            })),
            catchError(() => {
                this._toastService.error('Error deleting horse health');
                return of(null);
            }),
            finalize(() => this.isDeleting$.next(false)),
        ).subscribe();
    }

    public goBack(): void {
        this._modalController.dismiss({ deleted: false });
    }
}
