import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';
import { ToastService } from '@rfx/ngx-toast';
import { ModalController } from '@ionic/angular';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, finalize, take, tap } from 'rxjs/operators';
import { RideService } from '@caballus/ui-common';

@Component({
    selector: 'app-delete-incomplete-ride-modal',
    templateUrl: './delete-incomplete-ride-modal.component.html',
    styleUrls: ['./delete-incomplete-ride-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeleteIncompleteRideModalComponent implements OnInit {
    @Input()
    public rideId!: string;
    public isDeleting$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    constructor(
        private readonly _modalController: ModalController,
        private readonly _rideService: RideService,
        private readonly _toastService: ToastService
    ) {}

    public ngOnInit(): void {
    }

    public deleteRide(): void {
        this.isDeleting$.next(true);
        this._rideService.deleteRide(this.rideId).pipe(
            take(1),
            tap(() => this._modalController.dismiss({
                deleted: true
            })),
            catchError(() => {
                this._toastService.error('Error getting ride delete');
                return of(null);
            }),
            finalize(() => this.isDeleting$.next(false)),
        ).subscribe();
    }
}
