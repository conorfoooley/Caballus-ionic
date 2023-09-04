import { CommonModule } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HorsePermission } from '@caballus/ui-common';
import { HorseCache } from '@ion-caballus/core/caches';
import { runOnPushChangeDetection } from '@ion-caballus/core/util';
import { IonicModule, ModalController } from '@ionic/angular';
import { ToastService } from '@rfx/ngx-toast';
import { of } from 'rxjs';
import { HorseProfileImageModalComponent } from './horse-profile-image-modal.component';

const MockModalController = {
    dismiss: jest.fn()
};

const MockHorseCache = {
    getHorse: jest.fn().mockReturnValue(of({ profile: { profilePicture: { url: 'someurl' } } })),
    getHorseRelationships: jest.fn()
};

const MockToastService = {
    error: jest.fn()
};

function mockUserPermissions(permissions: HorsePermission[] = []) {
    MockHorseCache.getHorseRelationships.mockReturnValueOnce(
        of({ loggedInUserRole: { permissions: [...permissions] } })
    );
}

describe('HorseProfileImageModalComponent', () => {
    let component: HorseProfileImageModalComponent;
    let fixture: ComponentFixture<HorseProfileImageModalComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [HorseProfileImageModalComponent],
            imports: [CommonModule, IonicModule],
            providers: [
                { provide: ModalController, useValue: MockModalController },
                { provide: HorseCache, useValue: MockHorseCache },
                { provide: ToastService, useValue: MockToastService }
            ]
        }).compileComponents();
    }));

    beforeEach(async () => {
        MockHorseCache.getHorse.mockClear();
        MockHorseCache.getHorseRelationships.mockClear();
        MockModalController.dismiss.mockClear();
        fixture = TestBed.createComponent(HorseProfileImageModalComponent);
        component = fixture.componentInstance;
        component.horseId = 'abc';
    });

    it('should create', async done => {
        mockUserPermissions([HorsePermission.HorseEdit]);

        fixture.detectChanges();
        await runOnPushChangeDetection(fixture);

        expect(component).toBeTruthy();
        done();
    });

    it('should get horse and permissions data', async done => {
        mockUserPermissions([HorsePermission.HorseEdit]);

        fixture.detectChanges();
        await runOnPushChangeDetection(fixture);

        expect(MockHorseCache.getHorse).toHaveBeenCalledTimes(1);
        expect(MockHorseCache.getHorseRelationships).toHaveBeenCalledTimes(1);
        done();
    });

    it('should show horse profile image', async done => {
        mockUserPermissions([HorsePermission.HorseEdit]);

        fixture.detectChanges();
        await runOnPushChangeDetection(fixture);

        const button = fixture.debugElement.query(By.css('ion-img'));

        expect(button).not.toBeFalsy();
        done();
    });

    it('should show change image button when user has permissions', async done => {
        mockUserPermissions([HorsePermission.HorseEdit]);

        fixture.detectChanges();
        await runOnPushChangeDetection(fixture);

        const button = fixture.debugElement.query(By.css('.actions-container button'));

        expect(button).not.toBeFalsy();
        done();
    });

    it('should not show change image button when user does not have permissions', async done => {
        mockUserPermissions([]);

        fixture.detectChanges();
        await runOnPushChangeDetection(fixture);

        const button = fixture.debugElement.query(By.css('.actions-container button'));

        expect(button).toBeNull();
        done();
    });

    it('should dismiss modal when close button is clicked', async done => {
        mockUserPermissions([]);

        fixture.detectChanges();
        await runOnPushChangeDetection(fixture);

        const dismissButton = fixture.debugElement.query(By.css('ion-buttons ion-button'));
        dismissButton.nativeElement.click();

        expect(MockModalController.dismiss).toHaveBeenCalledTimes(1);
        done();
    });

    it('should dismiss modal when change image button is clicked', async done => {
        mockUserPermissions([HorsePermission.HorseEdit]);

        fixture.detectChanges();
        await runOnPushChangeDetection(fixture);

        const dismissButton = fixture.debugElement.query(By.css('.actions-container button'));
        dismissButton.nativeElement.click();

        expect(MockModalController.dismiss).toHaveBeenCalledTimes(1);
        done();
    });
});
