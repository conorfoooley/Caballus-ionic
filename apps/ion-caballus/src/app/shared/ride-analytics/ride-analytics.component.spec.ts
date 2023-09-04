import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RideAnalyticsComponent } from './ride-analytics.component';
import { of } from 'rxjs';
import { Gait, GaitNumbers, User, WayPoint } from '@caballus/ui-common';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { IonicModule } from '@ionic/angular';
import { NgxsModule, Store } from '@ngxs/store';
import { runOnPushChangeDetection } from '@ion-caballus/core/util/unit-tests';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NgChartsModule } from 'ng2-charts';
import { RideCache } from '@ion-caballus/core/caches';
const MockRideCache = {
    getCurrentRide: jest.fn(),
};
const MarkMS = (new Date('2021-01-01T00:00:00.000Z')).getTime();
const MockGaitProfile: GaitNumbers = {
    [Gait.None]: 0,
    [Gait.Walk]: 3.21869, // appx 2 miles per hour
    [Gait.Trot]: 8.04672, // appx 5 miles per hour
    [Gait.Lope]: 14.4841, // appx 9 miles per hour
    [Gait.Gallop]: 30.5775 // appx 19 miles per hour
};

const MockCurrentRide = {
    calculatedGaitKilometers: [{
        metrics: MockGaitProfile
    }],
    paths: [{
        wayPoints: [
            new WayPoint({
                latitude: 43.57714674307984,
                longitude: -116.21364753762599,
                altitude: 0,
                timestamp: new Date(MarkMS)
            }),
            new WayPoint({ // appx 0.2017 km from previous
                latitude: 43.578961992095294,
                longitude: -116.2136332407891,
                altitude: 0,
                timestamp: new Date(MarkMS + 726667)
            }),
        ]
    }]
}
describe('RideAnalyticsComponent', () => {
    let component: RideAnalyticsComponent;
    let fixture: ComponentFixture<RideAnalyticsComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                RideAnalyticsComponent
            ],
            imports: [
                RouterTestingModule,
                BrowserAnimationsModule,
                IonicModule,
                NgChartsModule,
                NgxsModule.forRoot([])
            ],
            providers: [{ provide: RideCache, useValue: MockRideCache },],
            schemas: [NO_ERRORS_SCHEMA]
        })

            .compileComponents()

        const store: Store = TestBed.get(Store);
        store['select'] = jest.fn(() => of(new User()));
    }));

    const setupHelper = async (): Promise<void> => {
        fixture = TestBed.createComponent(RideAnalyticsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        await runOnPushChangeDetection(fixture);
    };

    beforeEach(() => {
        MockRideCache.getCurrentRide.mockReturnValue(of(MockCurrentRide));
    });

    it('should create', () => {
        setupHelper();
        expect(component).toBeTruthy();
        expect(component.speed$.getValue().avgSpeed).toEqual(0.62)
        expect(component.speed$.getValue().maxSpeed).toEqual(0.62)
    });
});