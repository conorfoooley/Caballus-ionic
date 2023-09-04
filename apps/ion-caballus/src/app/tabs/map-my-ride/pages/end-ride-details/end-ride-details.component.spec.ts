import { CommonModule, Location } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCommonModule } from '@angular/material/core';
import { RouterTestingModule } from '@angular/router/testing';
import { AppRideStatus, ModalService, Ride, RideCategory, RidePath } from '@caballus/ui-common';
import { MediaCache, RideCache } from '@ion-caballus/core/caches';
import { StorageService } from '@ion-caballus/core/services';
import { runOnPushChangeDetection } from '@ion-caballus/core/util';
import { IonicModule } from '@ionic/angular';
import { ToastService } from '@rfx/ngx-toast';
import { of } from 'rxjs';
import { delay, filter, take } from 'rxjs/operators';
import { EndRideDetailsComponent } from './end-ride-details.component';

const MockRideCache = {
    getCurrentRide: jest.fn(),
    startRide: jest.fn(),
    startRideLocationRecording$: {
        next: jest.fn()
    },
    saveRideDetails: jest.fn(),
    deleteRide: jest.fn(),
    removeCurrentRide: jest.fn()
};

const MockModalService = {
    message: jest.fn(),
    confirm: jest.fn()
};

const MockToastService = {
    info: jest.fn()
};

const MockStorageService = {
    setUserData: jest.fn(),
    getUserData: jest.fn()
}

const MockMediaCache = {
    getCurrentRideMedia: () => of([])
}
describe('EndRideDetailsComponent', () => {
    let component: EndRideDetailsComponent;
    let fixture: ComponentFixture<EndRideDetailsComponent>;
    let location: Location;
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [EndRideDetailsComponent],
            imports: [
                CommonModule,
                IonicModule,
                RouterTestingModule.withRoutes([
                    {
                        path: '',
                        component: EndRideDetailsComponent
                    },
                    {
                        path: 'tabs/map-my-ride',
                        component: EndRideDetailsComponent
                    }
                ]),
                FormsModule,
                ReactiveFormsModule,
                MatCommonModule,
                MatButtonModule,
                HttpClientModule
            ],
            providers: [
                { provide: RideCache, useValue: MockRideCache },
                { provide: ModalService, useValue: MockModalService },
                { provide: ToastService, useValue: MockToastService },
                { provide: StorageService, useValue: MockStorageService },
                { provide: MediaCache, useValue: MockMediaCache }
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA]
        }).compileComponents();
    }));

    const setupHelper = (r: Ride): void => {
        MockRideCache.getCurrentRide.mockReturnValueOnce(of(r));
        MockStorageService.getUserData(of(r || new Ride({
            appRideStatus: AppRideStatus.EndRideDetails,
            paths: [new RidePath()],
        })))
        fixture = TestBed.createComponent(EndRideDetailsComponent);
        component = fixture.componentInstance;
        location = TestBed.get(Location);
        fixture.detectChanges();
    };

    it('should create', () => {
        const ride = new Ride({
            appRideStatus: AppRideStatus.EndRideDetails,
            paths: [new RidePath()],
        });
        setupHelper(ride);
        expect(component).toBeTruthy();
    });

    it('should restore the existing ride on open', async () => {
        const ride = new Ride({
            appRideStatus: AppRideStatus.EndRideDetails,
            paths: [new RidePath()],
        });
        setupHelper(ride);
        await runOnPushChangeDetection(fixture);
        return component.ride$
            .pipe(take(1))
            .toPromise()
            .then(r => {
                expect(r).toStrictEqual(ride);
            });
    });

    it('should save a ride', async done => {
        MockRideCache.saveRideDetails.mockReturnValueOnce(of(undefined));
        const ride = new Ride({});
        setupHelper(ride);
        component.form.controls.category.setValue(RideCategory.Arena);
        await runOnPushChangeDetection(fixture);
        component.rideSaved$.pipe(filter(v => v)).subscribe(() => {
            expect(MockRideCache.saveRideDetails).toHaveBeenCalled();
            done();
        });
        component.saveRide();
    });

    it('should show a modal when category has not been selected on save a ride', async done => {
        MockModalService.message.mockReturnValueOnce({
            afterClosed: jest.fn().mockReturnValue(of(undefined))
        });
        MockRideCache.saveRideDetails.mockReturnValueOnce(of(undefined));
        const ride = new Ride({});
        setupHelper(ride);
        await runOnPushChangeDetection(fixture);
        component['_saveRide$'].subscribe(() => {
            expect(MockModalService.message).toHaveBeenCalled();
            done();
        });
        component.saveRide();
    });

    it('should delete a ride', async done => {
        MockModalService.confirm.mockReturnValueOnce({
            afterClosed: jest.fn().mockReturnValue(of(true))
        });
        MockRideCache.deleteRide.mockReturnValueOnce(of(undefined));
        MockRideCache.removeCurrentRide.mockReturnValueOnce(of(undefined));
        const ride = new Ride({
            _id: 'someid',
            appRideStatus: AppRideStatus.EndRideDetails,
            paths: [new RidePath()],
        });
        setupHelper(ride);
        await runOnPushChangeDetection(fixture);
        component['_deleteRide$'].pipe(delay(1)).subscribe(() => {
            expect(MockToastService.info).toHaveBeenCalled();
            expect(MockToastService.info).toHaveBeenCalled();
            expect(location.path()).toBe('/tabs/map-my-ride');
            done();
        });
        component.deleteRide();
    });
});
