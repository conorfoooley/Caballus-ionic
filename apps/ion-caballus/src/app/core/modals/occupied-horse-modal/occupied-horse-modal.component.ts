import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { calculateRideTime, getCenterpoint, Horse, HorseForRide, MINIMUM_RIDE_DURATION, Ride, RideService, WayPoint } from '@caballus/ui-common';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { switchMap, take, tap, finalize } from 'rxjs/operators';
import { StorageService } from '../../services/storage.service';
import { flatMap } from 'lodash';
const STATE_KEY = 'currentRide' as const;
@Component({
    selector: 'app-occupied-horse-modal',
    templateUrl: './occupied-horse-modal.component.html',
    styleUrls: ['./occupied-horse-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OccupiedHorseModalComponent implements OnInit {

    @Input()
    public horse$!: Observable<HorseForRide>;

    @Input()
    public ride$!: Observable<Ride>;

    public showSaveDeleteModal: boolean = false;

    public showIncompleteDeleteModal: boolean = false;

    public isContinue: boolean = false;

    public isDeleting$: BehaviorSubject<boolean> = new BehaviorSubject(false);

    public isSaving$: BehaviorSubject<boolean> = new BehaviorSubject(false);

    constructor(
        private readonly _modalController: ModalController,
        private readonly _rideService: RideService,
        private readonly _storageService: StorageService,
    ) {}

    public ngOnInit(): void {
    }

    public yesNoInUseModal(isContinue: boolean): void {
        this.isContinue = isContinue;
        this.showSaveDeleteModal = true;
    }

    public save(): void {
        this.isSaving$.next(true);
        this.ride$.pipe(
            take(1),
            switchMap((ride: Ride) => {
                const wayPoints = flatMap(ride.paths, 'wayPoints') as WayPoint[];
                const centerPoint = getCenterpoint(wayPoints, false);
                if (calculateRideTime(ride) > MINIMUM_RIDE_DURATION && centerPoint?.latitude && centerPoint?.longitude) {
                    return combineLatest([this.horse$, this._rideService.saveOngoingRide(ride._id)])
                } else {
                    this.showIncompleteDeleteModal = true;
                    return of(null);
                }
            }),
            tap(async (h) => {
                if (h?.length) {
                    await this._storageService.clearUserData(STATE_KEY)
                    return this._modalController.dismiss({ id: h[0]._id, include: this.isContinue })
                }
            }),
            finalize(() => this.isSaving$.next(false))
        ).subscribe()
    }

    public deleteInCompleteRide(): void {
        this.isDeleting$.next(true)
        this.ride$.pipe(
            take(1),
            switchMap((ride: Ride) => this._rideService.deleteEntyRide(ride._id)),
            switchMap(() => this.horse$),
            tap(async (h) => {
                await this._storageService.clearUserData(STATE_KEY)
                return this._modalController.dismiss({ id: h._id, include: this.isContinue })
            }),
            finalize(() => this.isDeleting$.next(false))
        ).subscribe();
    }

    public deleteRide(): void {
        this.isDeleting$.next(true)
        this.ride$.pipe(
            take(1),
            switchMap((ride: Ride) =>  combineLatest([this.horse$, this._rideService.deleteEntyRide(ride._id)])),
            tap(async ([h]) => {
                await this._storageService.clearUserData(STATE_KEY)
                return this._modalController.dismiss({ id: h._id, include: this.isContinue })
            }),
            finalize(() => this.isDeleting$.next(false))
        ).subscribe();
    }
}
