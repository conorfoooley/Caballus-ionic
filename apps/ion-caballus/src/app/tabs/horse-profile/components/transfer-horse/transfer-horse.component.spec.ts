import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TransferHorseComponent } from './transfer-horse.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RfxFormsModule } from '@rfx/ngx-forms';
import { Address, HorseDetails, UiCommonModule, User, UserIdentity, UserService } from '@caballus/ui-common';
import { ToastService } from '@rfx/ngx-toast';
import { UiLibraryModule } from '@caballus/ui-library';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ModalController } from '@ionic/angular';
import { runOnPushChangeDetection } from '@ion-caballus/core/util';
import { HorseCache } from '../../../../core/caches/horse/horse.cache';
import { of } from 'rxjs';
import { MatCardModule } from '@angular/material/card';

const MockModalController = {
    dismiss: jest.fn()
};

const MockHorseCache = {
    transferHorseProfile: jest.fn(),
    cancelTransferHorseProfile: jest.fn()
};

const MockUserService = {
    getUserByEmail: jest.fn(),
    getUser: jest.fn()
};

const MockToastService = {
    error: jest.fn()
};

const user = new User({ profile: { firstName: 'John', lastName: 'Doe', email: 'johndoe@example.com', phone: '', address: new Address(), profilePicture: null, _id: '16e0e107-7b19-48f3-9d81-d0dacc6aea14', url: '' }, _id: '16e0e107-7b19-48f3-9d81-d0dacc6aea14' });


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
describe('TransferHorseComponent', () => {
    let component: TransferHorseComponent;
    let fixture: ComponentFixture<TransferHorseComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [TransferHorseComponent],
            imports: [
                BrowserAnimationsModule,
                IonicModule,
                CommonModule,
                FormsModule,
                ReactiveFormsModule,
                RfxFormsModule,
                UiCommonModule,
                UiLibraryModule,
                MatInputModule,
                MatFormFieldModule,
                MatProgressSpinnerModule,
                MatIconModule,
                MatProgressSpinnerModule,
                MatCheckboxModule,
                MatCardModule
            ],
            providers: [
                { provide: ModalController, useValue: MockModalController },
                { provide: HorseCache, useValue: MockHorseCache },
                { provide: ToastService, useValue: MockToastService },
                { provide: UserService, useValue: MockUserService }
            ]
        })
            .compileComponents();
    }));

    beforeEach(async () => {
        fixture = TestBed.createComponent(TransferHorseComponent);
        component = fixture.componentInstance;
        component.horse = new HorseDetails({
            _id: MockHorseProfile._id
        });
        fixture.detectChanges();
        await runOnPushChangeDetection(fixture);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should not search user with invalid email and set user variable on submit', async () => {
        component.searchControl.setValue('test');
        const user = new User({ profile: { firstName: 'John', lastName: 'Doe', email: 'johndoe@example.com', phone: '', address: new Address(), profilePicture: null, _id: '', url: '' } });
        MockUserService.getUserByEmail.mockReturnValue(of(user));
        const spyUserNext = spyOn(component.user$, 'next');
        const button = fixture.debugElement.query(By.css('.email-search'));
        button.triggerEventHandler('click', null);
        await runOnPushChangeDetection(fixture);
        expect(spyUserNext).not.toBeCalled();
        expect(component.searchControl.invalid).toEqual(true);
    });

    it('should search user by valid email and set user variable on submit', async () => {
        component.searchControl.setValue('johndoe@example.com');
        MockUserService.getUserByEmail.mockReturnValue(of(user));
        const spyUserNext = spyOn(component.user$, 'next');
        const button = fixture.debugElement.query(By.css('.email-search'));
        button.triggerEventHandler('click', null);
        await runOnPushChangeDetection(fixture);
        expect(spyUserNext).toHaveBeenCalledWith(expect.objectContaining(user));
    });


    it('should initiate-user with searched user id', async () => {
        component.searchControl.setValue('johndoe@example.com');
        MockHorseCache.transferHorseProfile.mockReturnValue(of(null));
        MockUserService.getUserByEmail.mockReturnValue(of(user));
        component.user$.next(user);
        await runOnPushChangeDetection(fixture);
        const button = fixture.debugElement.query(By.css('.initiate-user'));
        button.triggerEventHandler('click', null);
        await runOnPushChangeDetection(fixture);
        expect(MockModalController.dismiss).toHaveBeenCalledWith(expect.objectContaining({ transferred: true }));
    });


    it('should reset user search data on click go back after search', async () => {
        component.searchControl.setValue('johndoe@example.com');
        MockUserService.getUserByEmail.mockReturnValue(of(user));
        component.user$.next(user);
        await runOnPushChangeDetection(fixture);
        const spyUserNext = spyOn(component.user$, 'next');
        const button = fixture.debugElement.query(By.css('.reset-user'));
        button.triggerEventHandler('click', null);
        await runOnPushChangeDetection(fixture);
        expect(spyUserNext).toHaveBeenCalledWith(null);
        expect(component.searchControl.value).toEqual('');
    });

    it('should cancel-transfer', async () => {
        component.cancelTransferModal = true;
        MockHorseCache.cancelTransferHorseProfile.mockReturnValue(of(null));
        component.user$.next(user);
        component.horse = new HorseDetails({
            _id: MockHorseProfile._id,
        });
        MockUserService.getUser.mockReturnValue(of(user));
        component.ngOnInit();
        await runOnPushChangeDetection(fixture);
        const button = fixture.debugElement.query(By.css('.cancel-transfer'));
        button.triggerEventHandler('click', null);
        await runOnPushChangeDetection(fixture);
        expect(MockModalController.dismiss).toHaveBeenCalledWith(expect.objectContaining({ cancelTransferred: true }));
    });

    it('should dismiss with cancelTransferred false and transferred false when user goes back', async () => {
        component.cancelTransferModal = true;
        const button = fixture.debugElement.query(By.css('.go-back'));
        button.triggerEventHandler('click', null);
        await runOnPushChangeDetection(fixture);
        expect(MockModalController.dismiss).toHaveBeenCalledWith(expect.objectContaining({ cancelTransferred: false, transferred: false }));
    });
});
