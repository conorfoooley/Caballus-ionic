import { Component, Input } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RfxFormsModule } from '@rfx/ngx-forms';
import { UiCommonModule } from '@caballus/ui-common';
import { UiLibraryModule } from '@caballus/ui-library';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MapMyRideComponent } from './map-my-ride.component';
import { ToastService } from '@rfx/ngx-toast';
import { HorseCache, RideCache } from '@ion-caballus/core/caches';
import { runOnPushChangeDetection } from '@ion-caballus/core/util';
import { CapacitorPluginService, ModalService } from '@ion-caballus/core/services';
import { of } from 'rxjs';
import { take } from 'rxjs/operators';
import { HorseForRide, User, Ride, HorseIdentity, HorseService } from '@caballus/ui-common';
import { NgxsModule, Store } from '@ngxs/store';

const MockRides = [
    {
        "createdDate": "2021-09-29T19:11:10.612Z",
        "modifiedDate": "2021-09-29T19:11:10.612Z",
        "status": 1,
        "horseIdentities": [
            {
                "label": "Blossom",
                "_id": "0",
                "gaitsKilometersPerHourSnapshot": {
                    "[Gait]_none": 0,
                    "[Gait]_walk": 3.21869,
                    "[Gait]_trot": 8.04672,
                    "[Gait]_lope": 14.4841,
                    "[Gait]_gallop": 30.5775
                }
            }
        ],
        "distanceKilometers": 0,
        "notes": "",
        "paths": [],
        "calculatedGaitMinutes": [],
        "manualGaitMinutes": [],
        "calculatedGaitKilometers": [],
        "_id": "61019ccb14c02bb345653154",
        "riderIdentity": {
            "label": "Ben Whitaker",
            "_id": "60de4aaa4623421450ec8411",
            "picture": {
                "path": "media/d000bee1-253b-45bb-91f2-417e820ecd6b",
                "name": "hip2.jpg",
                "type": "[MediaDocumentType] Image",
                "jwPlayerId": "",
                "url": "",
                "dateUploaded": "2021-09-15T21:34:20.593Z"
            }
        },
        "startDateTime": "2021-09-29T19:10:59.546Z",
        "rideStatus": "[RideStatus] inProgress"
    }
];
const MockToastService = {
    error: jest.fn()
};
const MockRideCache = {
    getCurrentRide: jest.fn(),
    startRide: jest.fn(),
    startRideLocationRecording$: {
        next: jest.fn()
    }
};
const MockHorseCache = {
    getHorsesForRide: jest.fn()
};
const MockCapacitorPluginService = {
    networkStatus: jest.fn(),
    hasLocationPermission: jest.fn(),
    requestLocationPermission: jest.fn()
};
const MockHorseService = {
    getHorsesOnRide: jest.fn()
};
const MockModalService = {
    occupiedHorse: jest.fn()
};

@Component({ selector: 'app-horse-select-banner', template: '' })
class HorseSelectBannerStubComponent {
    @Input() public control;
    @Input() public ride$;
    @Input() public clearSearch$;
}

describe('MapMyRideComponent', () => {
    let component: MapMyRideComponent;
    let fixture: ComponentFixture<MapMyRideComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                MapMyRideComponent,
                HorseSelectBannerStubComponent
            ],
            imports: [
                RouterTestingModule,
                BrowserAnimationsModule,
                CommonModule,
                IonicModule,
                FormsModule,
                ReactiveFormsModule,
                RfxFormsModule,
                UiCommonModule,
                UiLibraryModule,
                MatInputModule,
                MatFormFieldModule,
                MatIconModule,
                MatProgressSpinnerModule,
                MatCheckboxModule,
                NgxsModule.forRoot([])
            ],
            providers: [
                { provide: ToastService, useValue: MockToastService },
                { provide: HorseCache, useValue: MockHorseCache },
                { provide: RideCache, useValue: MockRideCache },
                { provide: CapacitorPluginService, useValue: MockCapacitorPluginService },
                { provide: HorseService, useValue: MockHorseService },
                { provide: ModalService, useValue: MockModalService }
            ]
        })
            .compileComponents();

        const store: Store = TestBed.get(Store);
        store['select'] = jest.fn(() => of(new User()));
    }));

    const setupHelper = async (): Promise<void> => {
        fixture = TestBed.createComponent(MapMyRideComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        await runOnPushChangeDetection(fixture);
    };

    beforeEach(() => {
        MockRideCache.getCurrentRide.mockReset();
        MockHorseCache.getHorsesForRide.mockReset();
        MockCapacitorPluginService.networkStatus.mockReset();
        MockHorseService.getHorsesOnRide.mockReset();
        MockModalService.occupiedHorse.mockReset();
    });

    it('should create', () => {
        setupHelper();
        expect(component).toBeTruthy();
    });

    it('should not start a ride without horses', () => {
        setupHelper();
        component.startNewRide();
        expect(MockToastService.error).toHaveBeenCalledWith('Select at least one horse to ride');
    });

    it('should start a ride when unoccupied horses selected and no current ride, and signal gps to start', () => {
        setupHelper();
        component.horseControl.setValue(['0']);
        component.ride$.next(null);
        const horse = new HorseForRide({ _id: '0', commonName: 'Stubby ' });
        MockRideCache.getCurrentRide.mockReturnValueOnce(of(null));
        MockHorseCache.getHorsesForRide.mockReturnValueOnce(of([horse]));
        MockCapacitorPluginService.networkStatus.mockReturnValueOnce(of({ connected: false }));
        MockRideCache.startRide.mockReturnValueOnce(of(new Ride()));
        MockCapacitorPluginService.hasLocationPermission.mockReturnValueOnce(of(true));
        component.startNewRide();
        expect(component.ride$.value).toBeTruthy();
        expect(MockRideCache.startRideLocationRecording$.next).toHaveBeenCalledTimes(1);
    });

    it('should restore the existing ride on open', async () => {
        const horseIdentities = [new HorseIdentity({ _id: '0', label: 'Spud', picture: null })];
        const ride = new Ride({ horseIdentities });
        MockRideCache.getCurrentRide.mockReturnValue(of(ride));
        setupHelper();
        component.ionViewWillEnter();
        await runOnPushChangeDetection(fixture);
        return component.ride$.pipe(take(1)).toPromise().then(r => {
            expect(r).toStrictEqual(ride);
            expect(component.horseControl.value).toStrictEqual(horseIdentities.map(h => h._id));
        });
    });

    it('should open a modal for each occupied horse when starting a ride', async () => {
        const horse = new HorseForRide({ _id: '0', commonName: 'Stubby ' });
        MockRideCache.getCurrentRide.mockReturnValueOnce(of(null));
        MockHorseCache.getHorsesForRide.mockReturnValueOnce(of([horse]));
        MockCapacitorPluginService.networkStatus.mockReturnValueOnce(of({ connected: true }));
        MockHorseService.getHorsesOnRide.mockReturnValueOnce(of(MockRides));
        MockModalService.occupiedHorse.mockReturnValueOnce(of({ id: '0', include: false }));
        MockCapacitorPluginService.hasLocationPermission.mockReturnValueOnce(of(true));
        setupHelper();
        component.horseControl.setValue(['0']);
        return component.startNewRide();
        await runOnPushChangeDetection(fixture);
        expect(MockModalService.occupiedHorse).toHaveBeenCalledTimes(1);
    });
});
