import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';
import { HorseProfileStatus } from '@caballus/ui-common';
import { ToastService } from '@rfx/ngx-toast';
import { HorseCache } from '../../caches/horse/horse.cache';
import { ModalController } from '@ionic/angular';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, finalize, take, tap } from 'rxjs/operators';

@Component({
    selector: 'app-disable-horse-modal',
    templateUrl: './disable-horse-modal.component.html',
    styleUrls: ['./disable-horse-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DisableHorseModalComponent implements OnInit {
    @Input()
    public horseId!: string;
    @Input()
    public profileStatus!: HorseProfileStatus;
    public HorseProfileStatus: typeof HorseProfileStatus = HorseProfileStatus;
    public isDisabling$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    constructor(
        private readonly _modalController: ModalController,
        private readonly _horseCache: HorseCache,
        private readonly _toastService: ToastService
    ) { }

    public ngOnInit(): void {
    }

    public disableHorse(): void {
        this.isDisabling$.next(true);
        this._horseCache.toggleHorseProfileStatus(this.horseId, this.profileStatus).pipe(
            take(1),
            tap(profileStatus => this._modalController.dismiss({
                confirm: true,
                profileStatus
            })),
            catchError(() => {
                this._toastService.error('Error getting horse enable/disable profile');
                return of(null);
            }),
            finalize(() => this.isDisabling$.next(false)),
        ).subscribe();
    }

    public goBack(): void {
        this._modalController.dismiss({ confirm: false });
    }
}
