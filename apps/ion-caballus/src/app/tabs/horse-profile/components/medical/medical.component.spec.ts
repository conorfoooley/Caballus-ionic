import { async, ComponentFixture, TestBed, tick } from '@angular/core/testing';
import { MedicalComponent } from './medical.component';
import { ToastService } from '@rfx/ngx-toast';
import { BehaviorSubject, of } from 'rxjs';
import { HorseHealthSimple, UiCommonModule, User } from '@caballus/ui-common';
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
import { HorseHealthType, HorseVeterinarianProfile, State } from '@caballus/common';
import { MatExpansionModule, MatExpansionPanel } from '@angular/material/expansion';
import { By } from '@angular/platform-browser';

const MockVeterinarianProfile = new HorseVeterinarianProfile({
    fullName: 'test',
    phone: '1234567890',
    email: 'test@example.com',
    address: {
        line1: 'Test address',
        line2: '',
        state: State.Alabama,
        city: 'test',
        postalCode: '12345'
    }
});
const MockHorseId = '6100a78d5f635611f95d22b2';
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

const MockHorseHealths = [{
    "_id": "6187ba2b0c89f8167cce7bd7",
    "date": new Date("2021-11-10T18:30:00.000Z"),
    "notes": "safafsafs",
    "horseHealthType": HorseHealthType.Health,
    "documents": [
        {
            "modifiedDate": new Date(),
            "createdDate": new Date(),
            "_id": "6187ba32d64f405e9cf159e5",
            "status": 1,
            "latest": {
                "path": "media/0786faab-e8a0-4d01-b392-5aa3f11f7a2d",
                "name": "pexels-photo-220453 - Copy.jpeg",
                "jwPlayerId": "",
                "url": "https://storage.googleapis.com/dev-rjhx7mog7t6e0vdfi1r76wdb/media/0786faab-e8a0-4d01-b392-5aa3f11f7a2d",
                "safeUrl": null,
                "dateUploaded": new Date()
            },
            "history": [
                {
                    "path": "media/0786faab-e8a0-4d01-b392-5aa3f11f7a2d",
                    "name": "pexels-photo-220453 - Copy.jpeg",
                    "jwPlayerId": "",
                    "url": "",
                    "dateUploaded": new Date(),
                    "safeUrl": null
                }
            ],
            "thumbnail": {
                "path": "media/a06d40b3-8f2c-4b2f-a4a7-19398fb6ff7f",
                "name": "thumbnail_pexels-photo-220453 - Copy.jpeg",
                "jwPlayerId": "",
                "url": "",
                "dateUploaded": new Date(),
                "safeUrl": null
            },
            "uploadedBy": {
                "label": "Ben Whitaker",
                "_id": "60de4aaa4623421450ec8411",
                "picture": {
                    "path": "media/d000bee1-253b-45bb-91f2-417e820ecd6b",
                    "name": "hip2.jpg",
                    "jwPlayerId": "",
                    "url": "",
                    "dateUploaded": new Date(),
                    "safeUrl": null
                }
            },
            "collection": "horseHealth",
            "collectionId": "6187ba2b0c89f8167cce7bd7",
            "galleryCategory": null
        },
    ]
}]

const MockHorseCache = {
    getHorseVeterinarianProfileByHorseId: jest.fn(),
    getHorseHealthByHorseId: jest.fn(),
    updateHorseVeterinarianProfileByHorseId: jest.fn(),
    getHorse: jest.fn(),
};

const MockToastService = {
    error: jest.fn(),
    success: jest.fn()
};

const MockActivateRoute = {
    paramMap: new BehaviorSubject({
        get: () => MockHorseId
    })
};

const MockRouter = {
    navigateByUrl: jest.fn(),
    getCurrentNavigation: jest.fn(),
    navigate: jest.fn()
};

const MockModalService = {
    addEditHorseHealthModal: jest.fn()
}


describe('MedicalComponent', () => {
    let component: MedicalComponent;
    let fixture: ComponentFixture<MedicalComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                MedicalComponent
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
                MatExpansionModule,
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
        fixture = TestBed.createComponent(MedicalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        await runOnPushChangeDetection(fixture);
    };

    beforeEach(() => {
        MockHorseCache.getHorseHealthByHorseId.mockReturnValue(of(MockHorseHealths))
        MockHorseCache.getHorseVeterinarianProfileByHorseId.mockReturnValue(of(MockVeterinarianProfile));
    });

    it('should create', async () => {
        setupHelper();
        expect(component).toBeTruthy();
        delete MockVeterinarianProfile.address.line2;
        expect(component.contactForm.value).toEqual(expect.objectContaining(MockVeterinarianProfile));
        expect(component.horseHealth$.getValue()).toEqual(expect.objectContaining({
            [HorseHealthType.Health]: MockHorseHealths
        }));
    });

    it('backToHorseList should call router navigateByUrl to go previous page', async () => {
        component.backToHorseList();
        expect(MockRouter.navigateByUrl).toBeCalled();
    });

    it('togglePanel with Health HorseHealthType should open Expansion Accordion', async () => {
        component.togglePanel(HorseHealthType.Health);
        expect(component.panelOpenState[HorseHealthType.Health]).toBeTruthy()
    });

    it('togglePanel with Health HorseHealthType should close Expansion Accordion', async () => {
        component.togglePanel(HorseHealthType.Health);
        expect(component.panelOpenState[HorseHealthType.Health]).toBeFalsy()
    });

    it('on cancel VeterinarianProfile with reset Veterinarian profile with previous data', async () => {
        const updatedProfile = {
            fullName: 'Testing new'
        };
        component.contactForm.patchValue(updatedProfile);
        component.resetContactForm();
        expect(component.contactForm.value).toStrictEqual(expect.objectContaining(MockVeterinarianProfile));
    });

    it('on submit VeterinarianProfile with new horse Veterinarian profile should call horse cache updateHorseVeterinarianProfileByHorseId with toast success', async () => {
        const updatedProfile = {
            fullName: 'Testing new'
        };
        MockHorseCache.updateHorseVeterinarianProfileByHorseId.mockReturnValue(of(null));
        component.contactForm.patchValue(updatedProfile);
        component.submitContactForm();
        expect(MockToastService.success).toBeCalledWith('Horse veterinarian profile is saved');
    });

    it('on addEditHorseHealthModal method should call modal service method addEditHorseHealthModal and call save success method', async () => {
        MockModalService.addEditHorseHealthModal.mockReturnValue(of({ saved: true }));
        const horseHealth =  new HorseHealthSimple();
        component.addEditHorseHealthModal(HorseHealthType.Health, horseHealth);
        expect(MockModalService.addEditHorseHealthModal).toBeCalledWith(expect.objectContaining(horseHealth), MockHorseId, HorseHealthType.Health);
        expect(MockToastService.success).toBeCalledWith('Horse health is saved');
    });

    it('on addEditHorseHealthModal method should call modal service method addEditHorseHealthModal and call delete success method', async () => {
        MockModalService.addEditHorseHealthModal.mockReturnValue(of({ deleted: true }));
        const horseHealth =  new HorseHealthSimple();
        component.addEditHorseHealthModal(HorseHealthType.Health, horseHealth);
        expect(MockModalService.addEditHorseHealthModal).toBeCalledWith(expect.objectContaining(horseHealth), MockHorseId, HorseHealthType.Health);
        expect(MockToastService.success).toBeCalledWith('Horse health is deleted');
    });
});
