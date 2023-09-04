import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, DebugElement } from '@angular/core';
import { async, ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCommonModule } from '@angular/material/core';
import { AppRideStatus, ModalService, Ride, RidePath, WayPoint } from '@caballus/ui-common';
import { RideCache } from '@ion-caballus/core/caches';
import { runOnPushChangeDetection } from '@ion-caballus/core/util';
import { IonicModule } from '@ionic/angular';
import { ToastService } from '@rfx/ngx-toast';
import { of } from 'rxjs';
import { take } from 'rxjs/operators';
import { TimeAndDistanceComponent } from './time-and-distance.component';
import * as moment from 'moment';
import { By } from '@angular/platform-browser';

const MockRideCache = {
    getCurrentRide: jest.fn(),
    startRide: jest.fn(),
    startRideLocationRecording$: {
        next: jest.fn()
    },
    rideUpdates: jest.fn()
};

const MockModalService = {
    message: jest.fn(),
    rideDistance: jest.fn(),
    rideDuration: jest.fn()
};
const MockToastService = {
    info: jest.fn()
};

describe('TimeAndDistanceComponent', () => {
    let component: TimeAndDistanceComponent;
    let fixture: ComponentFixture<TimeAndDistanceComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [TimeAndDistanceComponent],
            imports: [
                CommonModule,
                IonicModule,
                FormsModule,
                ReactiveFormsModule,
                MatCommonModule,
                MatButtonModule
            ],
            providers: [
                { provide: RideCache, useValue: MockRideCache },
                { provide: ModalService, useValue: MockModalService },
                { provide: ToastService, useValue: MockToastService }
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA]
        }).compileComponents();
    }));

    const setupHelper = (r: Ride): void => {
        MockRideCache.getCurrentRide.mockReturnValueOnce(of(r));
        MockRideCache.rideUpdates.mockReturnValueOnce(of(r));
        MockModalService.rideDistance.mockClear();
        MockModalService.rideDuration.mockClear();
        MockModalService.message.mockClear();
        MockToastService.info.mockClear();
        fixture = TestBed.createComponent(TimeAndDistanceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    };

    it('should create', () => {
        setupHelper(null);
        expect(component).toBeTruthy();
    });

    it('should restore the existing ride on open', done => {
        const ride = new Ride({
            appRideStatus: AppRideStatus.EndRideDetails,
            paths: [new RidePath()]
        });
        setupHelper(ride);
        runOnPushChangeDetection(fixture);
        component.rideCompleted$.pipe(take(1)).subscribe(r => {
            expect(MockRideCache.rideUpdates).toHaveBeenCalled();
            done();
        });
    });

    it('should return distance', done => {
        const ride = new Ride({
            appRideStatus: AppRideStatus.EndRideDetails,
            paths: [
                new RidePath({
                    startDateTime: moment()
                        .subtract(1, 'minute')
                        .toDate(),
                    endDateTime: moment().toDate(),
                    wayPoints: [
                        new WayPoint({
                            altitude: 1,
                            latitude: 0,
                            longitude: 0
                        }),
                        new WayPoint({
                            altitude: 2,
                            latitude: 1,
                            longitude: 1
                        })
                    ]
                })
            ]
        });
        setupHelper(ride);
        runOnPushChangeDetection(fixture);
        component.rideDistance$.pipe(take(1)).subscribe(distance => {
            expect(distance).toBeGreaterThan(97);
            expect(distance).toBeLessThan(98);
            done();
        });
    });

    it('should return duration', done => {
        const ride = new Ride({
            appRideStatus: AppRideStatus.EndRideDetails,
            paths: [
                new RidePath({
                    startDateTime: moment()
                        .subtract(1, 'minute')
                        .toDate(),
                    endDateTime: moment().toDate(),
                    wayPoints: [
                        new WayPoint({
                            altitude: 1,
                            latitude: 0,
                            longitude: 0
                        }),
                        new WayPoint({
                            altitude: 2,
                            latitude: 1,
                            longitude: 1
                        })
                    ]
                })
            ]
        });
        setupHelper(ride);
        runOnPushChangeDetection(fixture);
        component.rideDuration$.pipe(take(1)).subscribe(duration => {
            expect(duration).toBeGreaterThanOrEqual(60000);
            done();
        });
    });

    it('should display manual entry message once', async done => {
        const ride = new Ride({
            appRideStatus: AppRideStatus.EndRideDetails,
            paths: [
                new RidePath({
                    startDateTime: moment()
                        .subtract(1, 'minute')
                        .toDate(),
                    endDateTime: moment().toDate(),
                    wayPoints: [
                        new WayPoint({
                            altitude: 1,
                            latitude: 0,
                            longitude: 0
                        }),
                        new WayPoint({
                            altitude: 2,
                            latitude: 1,
                            longitude: 1
                        })
                    ]
                })
            ]
        });

        setupHelper(ride);

        const messageModalAfterClosed = jest.fn().mockReturnValue(of(undefined));
        MockModalService.message.mockReturnValue({
            afterClosed: messageModalAfterClosed
        });

        const rideDurationModalAfterClosed = jest.fn().mockReturnValue(
            of({
                changed: true,
                duration: '00:00:00',
                reset: false
            })
        );
        MockModalService.rideDuration.mockReturnValue({
            afterClosed: rideDurationModalAfterClosed
        });

        const rideDistanceModalAfterClosed = jest.fn().mockReturnValue(
            of({
                changed: true,
                distance: 0.0,
                reset: false
            })
        );
        MockModalService.rideDistance.mockReturnValue({
            afterClosed: rideDistanceModalAfterClosed
        });

        await runOnPushChangeDetection(fixture);

        component.manualEntry.subscribe(value => {
            if (
                rideDurationModalAfterClosed.mock.calls.length &&
                rideDistanceModalAfterClosed.mock.calls.length
            ) {
                expect(messageModalAfterClosed).toHaveBeenCalledTimes(1);
                expect(rideDurationModalAfterClosed).toHaveBeenCalledTimes(1);
                expect(rideDistanceModalAfterClosed).toHaveBeenCalledTimes(1);
                done();
            }
        });

        const durationEl: DebugElement = fixture.debugElement.query(By.css('.duration h4'));
        durationEl.nativeElement.click();

        const distanceEl: DebugElement = fixture.debugElement.query(By.css('.distance h4'));
        distanceEl.nativeElement.click();
    });

    it('should emit that a manual entry was performed after duration edit', async done => {
        const ride = new Ride({
            appRideStatus: AppRideStatus.EndRideDetails,
            paths: [
                new RidePath({
                    startDateTime: moment()
                        .subtract(1, 'minute')
                        .toDate(),
                    endDateTime: moment().toDate(),
                    wayPoints: [
                        new WayPoint({
                            altitude: 1,
                            latitude: 0,
                            longitude: 0
                        }),
                        new WayPoint({
                            altitude: 2,
                            latitude: 1,
                            longitude: 1
                        })
                    ]
                })
            ]
        });

        setupHelper(ride);

        const messageModalAfterClosed = jest.fn().mockReturnValue(of(undefined));
        MockModalService.message.mockReturnValue({
            afterClosed: messageModalAfterClosed
        });

        const rideDurationModalAfterClosed = jest.fn().mockReturnValue(
            of({
                changed: true,
                duration: '00:00:00',
                reset: false
            })
        );
        MockModalService.rideDuration.mockReturnValue({
            afterClosed: rideDurationModalAfterClosed
        });

        await runOnPushChangeDetection(fixture);

        component.manualEntry.subscribe(value => {
            expect(messageModalAfterClosed).toHaveBeenCalledTimes(1);
            expect(rideDurationModalAfterClosed).toHaveBeenCalledTimes(1);
            expect(value.changed).toBe(true);
            expect(value.duration).toBe(0);
            done();
        });

        const durationEl: DebugElement = fixture.debugElement.query(By.css('.duration h4'));
        durationEl.nativeElement.click();
    });

    it('should emit that a manual entry was performed after distance edit', async done => {
        const ride = new Ride({
            appRideStatus: AppRideStatus.EndRideDetails,
            paths: [
                new RidePath({
                    startDateTime: moment()
                        .subtract(1, 'minute')
                        .toDate(),
                    endDateTime: moment().toDate(),
                    wayPoints: [
                        new WayPoint({
                            altitude: 1,
                            latitude: 0,
                            longitude: 0
                        }),
                        new WayPoint({
                            altitude: 2,
                            latitude: 1,
                            longitude: 1
                        })
                    ]
                })
            ]
        });

        setupHelper(ride);

        const messageModalAfterClosed = jest.fn().mockReturnValue(of(undefined));
        MockModalService.message.mockReturnValue({
            afterClosed: messageModalAfterClosed
        });

        const rideDistanceModalAfterClosed = jest.fn().mockReturnValue(
            of({
                changed: true,
                distance: 0.0,
                reset: false
            })
        );
        MockModalService.rideDistance.mockReturnValue({
            afterClosed: rideDistanceModalAfterClosed
        });

        await runOnPushChangeDetection(fixture);

        component.manualEntry.subscribe(value => {
            expect(messageModalAfterClosed).toHaveBeenCalledTimes(1);
            expect(rideDistanceModalAfterClosed).toHaveBeenCalledTimes(1);
            expect(value.changed).toBe(true);
            expect(value.distance).toBe(0);
            done();
        });

        const durationEl: DebugElement = fixture.debugElement.query(By.css('.distance h4'));
        durationEl.nativeElement.click();
    });

    it('should emit that a manual entry was reset after duration reset', async done => {
        const ride = new Ride({
            appRideStatus: AppRideStatus.EndRideDetails,
            paths: [
                new RidePath({
                    startDateTime: moment()
                        .subtract(1, 'minute')
                        .toDate(),
                    endDateTime: moment().toDate(),
                    wayPoints: [
                        new WayPoint({
                            altitude: 1,
                            latitude: 0,
                            longitude: 0
                        }),
                        new WayPoint({
                            altitude: 2,
                            latitude: 1,
                            longitude: 1
                        })
                    ]
                })
            ]
        });

        setupHelper(ride);

        const messageModalAfterClosed = jest.fn().mockReturnValue(of(undefined));
        MockModalService.message.mockReturnValue({
            afterClosed: messageModalAfterClosed
        });

        const rideDurationModalAfterClosed = jest.fn().mockReturnValue(
            of({
                changed: false,
                duration: '00:00:00',
                reset: true
            })
        );
        MockModalService.rideDuration.mockReturnValue({
            afterClosed: rideDurationModalAfterClosed
        });

        await runOnPushChangeDetection(fixture);

        component.manualEntry.subscribe(value => {
            expect(messageModalAfterClosed).toHaveBeenCalledTimes(1);
            expect(rideDurationModalAfterClosed).toHaveBeenCalledTimes(1);
            expect(value.changed).toBe(false);
            expect(value.duration).toBe(component['_rideCachedDuration']);
            done();
        });

        const durationEl: DebugElement = fixture.debugElement.query(By.css('.duration h4'));
        durationEl.nativeElement.click();
    });

    it('should emit that a manual entry was reset after distance reset', async done => {
        const ride = new Ride({
            appRideStatus: AppRideStatus.EndRideDetails,
            paths: [
                new RidePath({
                    startDateTime: moment()
                        .subtract(1, 'minute')
                        .toDate(),
                    endDateTime: moment().toDate(),
                    wayPoints: [
                        new WayPoint({
                            altitude: 1,
                            latitude: 0,
                            longitude: 0
                        }),
                        new WayPoint({
                            altitude: 2,
                            latitude: 1,
                            longitude: 1
                        })
                    ]
                })
            ]
        });

        setupHelper(ride);

        const messageModalAfterClosed = jest.fn().mockReturnValue(of(undefined));
        MockModalService.message.mockReturnValue({
            afterClosed: messageModalAfterClosed
        });

        const rideDistanceModalAfterClosed = jest.fn().mockReturnValue(
            of({
                changed: false,
                distance: 0.0,
                reset: true
            })
        );
        MockModalService.rideDistance.mockReturnValue({
            afterClosed: rideDistanceModalAfterClosed
        });

        await runOnPushChangeDetection(fixture);

        component.manualEntry.subscribe(value => {
            expect(messageModalAfterClosed).toHaveBeenCalledTimes(1);
            expect(rideDistanceModalAfterClosed).toHaveBeenCalledTimes(1);
            expect(value.changed).toBe(false);
            expect(value.distance).toBe(component['_rideCachedDistance']);
            done();
        });

        const durationEl: DebugElement = fixture.debugElement.query(By.css('.distance h4'));
        durationEl.nativeElement.click();
    });

    it('should emit that a manual entry was performed when either duration or distance is reset but one of them is still changed', async done => {
        const ride = new Ride({
            appRideStatus: AppRideStatus.EndRideDetails,
            paths: [
                new RidePath({
                    startDateTime: moment()
                        .subtract(1, 'minute')
                        .toDate(),
                    endDateTime: moment().toDate(),
                    wayPoints: [
                        new WayPoint({
                            altitude: 1,
                            latitude: 0,
                            longitude: 0
                        }),
                        new WayPoint({
                            altitude: 2,
                            latitude: 1,
                            longitude: 1
                        })
                    ]
                })
            ]
        });

        setupHelper(ride);

        const messageModalAfterClosed = jest.fn().mockReturnValue(of(undefined));
        MockModalService.message.mockReturnValue({
            afterClosed: messageModalAfterClosed
        });

        const rideDurationModalAfterClosed = jest.fn().mockReturnValue(
            of({
                changed: true,
                duration: '00:00:00',
                reset: false
            })
        );
        MockModalService.rideDuration.mockReturnValue({
            afterClosed: rideDurationModalAfterClosed
        });

        const rideDistanceModalAfterClosed = jest.fn().mockReturnValue(
            of({
                changed: false,
                distance: 0.0,
                reset: true
            })
        );
        MockModalService.rideDistance.mockReturnValue({
            afterClosed: rideDistanceModalAfterClosed
        });

        await runOnPushChangeDetection(fixture);

        component.manualEntry.subscribe(value => {
            if (
                rideDurationModalAfterClosed.mock.calls.length &&
                rideDistanceModalAfterClosed.mock.calls.length
            ) {
                expect(messageModalAfterClosed).toHaveBeenCalledTimes(1);
                expect(rideDurationModalAfterClosed).toHaveBeenCalledTimes(1);
                expect(rideDistanceModalAfterClosed).toHaveBeenCalledTimes(1);
                expect(value.changed).toBe(true);
                expect(value.duration).toBe(0);
                expect(value.distance).toBe(component['_rideCachedDistance']);
                done();
            }
        });

        const durationEl: DebugElement = fixture.debugElement.query(By.css('.duration h4'));
        durationEl.nativeElement.click();

        const distanceEl: DebugElement = fixture.debugElement.query(By.css('.distance h4'));
        distanceEl.nativeElement.click();
    });
});
