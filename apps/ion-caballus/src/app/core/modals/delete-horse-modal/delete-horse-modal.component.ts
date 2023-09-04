import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';
import { ToastService } from '@rfx/ngx-toast';
import { HorseCache } from '../../caches/horse/horse.cache';
import { ModalController } from '@ionic/angular';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, finalize, take, tap } from 'rxjs/operators';

@Component({
    selector: 'app-delete-horse-modal',
    templateUrl: './delete-horse-modal.component.html',
    styleUrls: ['./delete-horse-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeleteHorseModalComponent implements OnInit {
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

    public deleteHorse(): void {
        this.isDeleting$.next(true);
        this._horseCache.deleteHorseById(this.horseId).pipe(
            take(1),
            tap(() => this._modalController.dismiss({
                deleted: true
            })),
            catchError(() => {
                this._toastService.error('Error getting horse delete');
                return of(null);
            }),
            finalize(() => this.isDeleting$.next(false)),
        ).subscribe();
    }

    public goBack(): void {
        this._modalController.dismiss({ deleted: false });
    }
}
