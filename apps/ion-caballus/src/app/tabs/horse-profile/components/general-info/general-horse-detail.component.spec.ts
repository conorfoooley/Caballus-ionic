import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { GeneralHorseDetailComponent } from './general-horse-detail.component';
import { ToastService } from '@rfx/ngx-toast';
import { BehaviorSubject, of } from 'rxjs';
import { HorseDetails, HorseProfileStatus, HorseService, UiCommonModule, User, UserIdentity } from '@caballus/ui-common';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RfxFormsModule } from '@rfx/ngx-forms';
import { MatInputModule } from '@angular/material/input';
import { UiLibraryModule } from 'libs/ui-library/src/lib/ui-library.module';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { NgxsModule, Store } from '@ngxs/store';
import { HttpClientModule } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { runOnPushChangeDetection } from '@ion-caballus/core/util/unit-tests';
import { ModalService } from '@ion-caballus/core/services';
import { HorseCache } from '@ion-caballus/core/caches';
import { Share } from '@capacitor/share';

const MockSampleRelationShipData = {
    "totalDistanceKilometers": 0,
    "totalMinutes": 6.627383333333333,
    "averageMinutesPerRide": 1.104563888888889,
    "averageKilometersPerRide": 0,
    "totalRides": 6,
    "totalRiders": 1,
    "riderNames": [
        "Ben Whitaker"
    ],
}
const MockSampleStatsData = {
    "trainersAndStudents": [],
    "owner": {
        "firstName": "Ben",
        "lastName": "Whitaker",
        "email": "ben@riafox.com",
        "_id": "60de4aaa4623421450ec8411",
        "profilePicture": {
            "path": "media/d000bee1-253b-45bb-91f2-417e820ecd6b"
        }
    }
}
const MockDeeplink = 'https://ion-caballus.qa.riafox.dev/tabs/horse-profile/detail-horse/general-tab/616dd38020de7857da9c5f82'


const MockHorseProfile = {
    "createdDate": "2021-10-02T15:39:33.200Z",
    "modifiedDate": "2021-10-02T15:39:33.200Z",
    "status": 1,
    "profile": {
        "profileStatus": "[HorseProfileStatus] active",
        "commonName": "Aardvark",
        "registeredName": "Aardvark reg",
        "breedOther": "test",
        "breed": "[HorseBreed] pony",
        "registrationNumber": "123455",
        "heightMeters": "100",
        "weightKilograms": "88"
    },
    "_id": "6100a78d5f635611f95d22b2",
    "lastRideDate": "2021-09-30T02:03:12.052Z",
    "lastRiderIdentity": {
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
    }
}

const MockHorseCache = {
    getHorseRelationships: jest.fn(),
    getHorseStatTotals: jest.fn(),
    getPinnedMediaByHorseId: jest.fn(),
    getHorse: jest.fn(),
    getHorseProfileDeeplink: jest.fn()
};

const MockToastService = {
    error: jest.fn(),
    success: jest.fn()
};

const MockActivateRoute = {
    paramMap: new BehaviorSubject({
        get: () => MockHorseProfile._id
    })
};

const MockRouter = {
    navigateByUrl: jest.fn(),
    getCurrentNavigation: jest.fn(),
    navigate: jest.fn()
};

const MockModalService = {
    deleteHorse: jest.fn(),
    disableEnableHorse: jest.fn(),
    transferHorse: jest.fn(),
    cancelTransferHorse: jest.fn()
}




describe('GeneralHorseDetailComponent', () => {
    let component: GeneralHorseDetailComponent;
    let fixture: ComponentFixture<GeneralHorseDetailComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                GeneralHorseDetailComponent
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
                HttpClientModule,
                MatCheckboxModule,
                MatCardModule,
                NgxsModule.forRoot([]),
            ],
            providers: [
                { provide: ToastService, useValue: MockToastService },
                { provide: ActivatedRoute, useValue: MockActivateRoute },
                { provide: Router, useValue: MockRouter },
                { provide: HorseCache, useValue: MockHorseCache, },
                { provide: ModalService, useValue: MockModalService }
            ]
        })
            .compileComponents();
        const store: Store = TestBed.get(Store);
        store['select'] = jest.fn(() => of(new User()));
    }));

    const setupHelper = async (): Promise<void> => {
        fixture = TestBed.createComponent(GeneralHorseDetailComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        await runOnPushChangeDetection(fixture);
    };

    beforeEach(() => {
        MockHorseCache.getHorse.mockReturnValue(of(MockHorseProfile))
        MockHorseCache.getHorseRelationships.mockReturnValue(of(MockSampleRelationShipData));
        MockHorseCache.getHorseStatTotals.mockReturnValue(of(MockSampleStatsData));
        MockHorseCache.getHorseProfileDeeplink.mockReturnValue(of(MockDeeplink));
        MockHorseCache.getPinnedMediaByHorseId.mockReturnValue(of([]));
        MockRouter.getCurrentNavigation.mockReturnValue({
            extras: {
                state: {
                    horse: MockHorseProfile
                }
            }
        });
    });

    it('should create', async () => {
        setupHelper();
        expect(component).toBeTruthy();
        await runOnPushChangeDetection(fixture);
        expect(component.horse$.getValue()._id).toEqual(MockHorseProfile._id);

    });

    it('minutesToHours should convert time minutes to hour', () => {
        expect(component.minutesToHours(60)).toEqual(1);
    });

    it('kilometersToMiles should convert distance km to miles', () => {
        expect(component.kilometersToMiles(1)).toEqual(0.6213727366498067);
    });

    it('backToHorseList should call router navigateByUrl to go previous page', () => {
        component.backToHorseList();
        expect(MockRouter.navigateByUrl).toBeCalled();
    });

    it('deleteHorse should call to delete modal method and on yes it should go previous page', () => {
        MockModalService.deleteHorse.mockReturnValue(of({ deleted: true }));
        component.deleteHorse();
        expect(MockRouter.navigate).toBeCalled();
    })

    it('disableEnableHorse should call to enable/disable modal method and on yes it should update profile status value', () => {
        MockModalService.disableEnableHorse.mockReturnValue(of({ confirm: true, profileStatus: HorseProfileStatus.Disabled }));
        component.disableEnableHorse();
        expect(component.horse$.getValue().profile.profileStatus).toEqual(HorseProfileStatus.Disabled);
    })

    it('disableEnableHorse should call to enable/disable modal method and on no it should same value of profile status', () => {
        MockModalService.disableEnableHorse.mockReturnValue(of({ confirm: false }));
        component.disableEnableHorse();
        expect(component.horse$.getValue().profile.profileStatus).toEqual(HorseProfileStatus.Disabled);
    })

    it('Transfer should call to transferHorse modal method', () => {
        const spyUserNext = spyOn(component.horse$, 'next');
        MockModalService.transferHorse.mockReturnValue(of({ transferred: true }));
        component.transferHorse();
        expect(spyUserNext).toBeCalled();
    })

    it('Cancel Transfer should call to cancelTransferHorse modal method', () => {
        const spyUserNext = spyOn(component.horse$, 'next');
        MockModalService.cancelTransferHorse.mockReturnValue(of({ cancelTransferred: true }));
        component.cancelTransferHorse();
        expect(spyUserNext).toBeCalled();
    })
});
