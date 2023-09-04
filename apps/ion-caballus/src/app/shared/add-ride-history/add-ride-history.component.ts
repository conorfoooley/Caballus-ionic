import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
    HorseService,
    RideCategory,
    RideHistorySimple,
    HorseDetails,
    Media,
    Ride,
    ModalService,
    RideService,
    KM_PER_MILE,
    kilometersToMiles
} from '@caballus/ui-common';
import { ToastService } from '@rfx/ngx-toast';
import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs';
import { map, shareReplay, take, tap } from 'rxjs/operators';
import { State } from '@rfx/ngx-forms';

interface CustomEvent {
    target: {
        complete: Function;
        disabled: boolean;
    };
}
@Component({
    selector: 'app-add-ride-history',
    templateUrl: './add-ride-history.component.html',
    styleUrls: ['./add-ride-history.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddRideHistoryComponent implements OnInit {
    public isLoading$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    private _onDestroy$: Subject<void> = new Subject<void>();
    public readonly RideCategory: typeof RideCategory = RideCategory;
    private _horseId$: Observable<string> = this._activatedRoute.paramMap.pipe(
        map(params => params.get('horseId')),
        shareReplay(1)
    );

    public states: { key: string; name: string }[] = State.members.map(t => ({
        key: t,
        name: State.toString(t)
    }));

    public hasNoData: boolean = false;
    public horsesDatas$: BehaviorSubject<HorseDetails[]> = new BehaviorSubject([]);
    public readonly mediaUpdates$: BehaviorSubject<Media[]> = new BehaviorSubject([]);
    public ride$: ReplaySubject<Ride> = new ReplaySubject(1);
    public editRide$: BehaviorSubject<RideHistorySimple> = new BehaviorSubject(null);
    public currentRideMedia$: BehaviorSubject<Media[]> = new BehaviorSubject([]);
    public startDate: Date = new Date();
    public horseIds: string[] = [];
    public rideCategory: RideCategory = RideCategory.Arena;
    public location: string = '';
    public notes: string = '';
    public distance: number = 0;
    public durationHours: number = 0;
    public durationMin: number = 0;
    public durationSec: number = 0;
    // public imageUrl1: string = '';
    // public imageUrl2: string = '';
    // public imageUrl3: string = '';
    // public imageUrl4: string = '';
    // public imageUrl5: string = '';

    public isDisable: boolean = true;

    constructor(
        private readonly _toastService: ToastService,
        private readonly _router: Router,
        private readonly _activatedRoute: ActivatedRoute,
        private readonly _horseService: HorseService,
        private readonly _modalService: ModalService,
        private readonly _rideService: RideService
    ) {}

    public ngOnInit(): void {
        this.isLoading$.next(true);
        this._getHorseList();
        this._openHorseListModal();
        const ride = new RideHistorySimple(this._router.getCurrentNavigation().extras.state?.ride);
        if (!ride._id) {
            this._rideService.createEmptyRide().subscribe(_ride => {
                this.ride$.next(_ride);
            });
            //select horse
            this._horseId$
                .pipe(
                    take(1),
                    tap(horseId => {
                        this.horseIds.push(horseId);
                    })
                )
                .subscribe();
            //
        } else {
            this.editRide$.next(ride);
            this.startDate = ride.startDateTime;
            this.horseIds = [];
            ride.horseIdentities.map(horse => {
                this.horseIds.push(horse._id);
            });
            this.rideCategory = ride.category;
            this.location = ride.name;
            this.distance = kilometersToMiles(ride.distanceKilometers);
            this.notes = ride.notes;
            const newDate = this.calculateDiff(ride.endDateTime, ride.startDateTime);
            this.ride$.next(
                new Ride({
                    _id: ride._id,
                    startDateTime: ride.startDateTime,
                    endDateTime: ride.endDateTime,
                    name: ride.name,
                    category: ride.category,
                    horseIdentities: ride.horseIdentities,
                    distanceKilometers: ride.distanceKilometers,
                    notes: ride.notes
                })
            );
            this.checkDisableStatus();
        }
    }

    private _openHorseListModal() {
        this.horsesDatas$
            .pipe(
                tap(horses => {
                    horses.length > 0
                        ? this._modalService
                              .horseList(horses)
                              .afterClosed()
                              .subscribe(res => {
                                  if (res?.status) {
                                      this.horseIds = res?.data;
                                  } else {
                                      this.goToRideHistory();
                                  }
                              })
                        : '';
                })
            )
            .subscribe();
    }

    public calculateDiff(date1: Date, date2: Date): void {
        const newDate1 = new Date(date1).getTime();
        const newDate2 = new Date(date2).getTime();
        const diff = (newDate1 - newDate2) / 1000;
        this.durationHours = Math.floor(diff / 3600);
        this.durationMin = Math.floor((diff - this.durationHours * 3600) / 60);
        this.durationSec = diff - this.durationHours * 3600 - this.durationMin * 60;
    }

    private _getHorseList(): void {
        this._horseService.getViewableHorses().subscribe(
            response => {
                this.isLoading$.next(false);
                if (!response.length) {
                    this.hasNoData = true;
                }
                this.horsesDatas$.next(response);
            },
            err => {
                this.isLoading$.next(false);
                this._toastService.error(err);
            }
        );
    }

    public ngOnDestroy(): void {
        this._onDestroy$.next();
        this._onDestroy$.complete();
    }

    public goBack(): void {
        this._modalService
            .confirm(
                'Go Back',
                'This entry has not been saved and you will loose any entered data.',
                'Continue',
                'Stay on this page'
            )
            .afterClosed()
            .subscribe(res => {
                if (res) {
                    this.editRide$.subscribe(editRide => {
                        if (editRide) {
                            this.goToRideHistory();
                        } else {
                            this.ride$.subscribe(ride => {
                                const rideId: string = ride._id;
                                this._rideService.deleteEntyRide(rideId).subscribe(response => {
                                    this.goToRideHistory();
                                });
                            });
                        }
                    });
                }
            });
    }

    public goToRideHistory(): void {
        this._horseId$
            .pipe(
                take(1),
                tap(horseId => {
                    if (!horseId) {
                        this._router.navigate([`/tabs/menu/my-ride-history`], {
                            state: {
                                isRefresh: true
                            }
                        });
                    } else {
                        this._router.navigate(
                            [`/tabs/horse-profile/detail-horse/ride-history/${horseId}`],
                            {
                                state: {
                                    isRefresh: true
                                }
                            }
                        );
                    }
                })
            )
            .subscribe();
    }

    public handleAttachedMedia(attachedMedia: Media[]): void {
        this.mediaUpdates$.next(attachedMedia);
    }

    public returnRide(): void {
        this.goBack();
    }

    public saveRide(): void {
        const endDuration =
            (this.durationHours * 3600 + this.durationMin * 60 + this.durationSec) * 1000;
        const endDateTime = new Date(new Date(this.startDate).getTime() + endDuration);
        this.isLoading$.next(true);
        this.ride$.subscribe(res => {
            const ride = {
                _id: res._id,
                startDateTime: new Date(this.startDate),
                endDateTime: endDateTime,
                horseIds: this.horseIds,
                category: this.rideCategory,
                name: this.location,
                notes: this.notes,
                distanceKilometers: this.distance * KM_PER_MILE
            };
            this._rideService.updateEntryRide(ride).subscribe(response => {
                this.isLoading$.next(false);
                this.goToRideHistory();
            });
        });
    }

    public onChangeDate(element: any): void {
        this.startDate = element.value as Date;
        this.checkDisableStatus();
    }

    public onChangeHorses(value: string[]): void {
        this.horseIds = value;
        this.checkDisableStatus();
    }

    public onChangeCategory(value: RideCategory): void {
        this.rideCategory = value;
        this.checkDisableStatus();
    }

    public onChangeLocation(element: any): void {
        this.location = element.value;
        this.checkDisableStatus();
    }

    public onChangeNotes(element: any): void {
        this.notes = element.value;
        this.checkDisableStatus();
    }

    public onChangeDistance(element: any): void {
        this.distance = element.value as number;
        this.checkDisableStatus();
    }

    public onChangeDurationHours(element: any): void {
        this.durationHours = Number(element.value);
        this.checkDisableStatus();
    }

    public onChangeDurationMin(element: any): void {
        this.durationMin = Number(element.value);
        this.checkDisableStatus();
    }

    public onChangeDurationSec(element: any): void {
        this.durationSec = Number(element.value);
    }

    public checkDisableStatus(): void {
        const endDuration =
            (this.durationHours * 3600 + this.durationMin * 60 + this.durationSec) * 1000;
        if (
            endDuration > 0 &&
            this.horseIds.length > 0 &&
            this.location !== '' &&
            this.notes !== '' &&
            this.distance > 0
        ) {
            this.isDisable = false;
        } else {
            this.isDisable = true;
        }
    }

    public selectedImage1(value: any): void {}

    public selectedImage2(value: any): void {}

    public selectedImage3(value: any): void {}

    public selectedImage4(value: any): void {}

    public selectedImage5(value: any): void {}
}
