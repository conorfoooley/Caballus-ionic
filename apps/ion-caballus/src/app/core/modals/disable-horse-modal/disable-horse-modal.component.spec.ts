import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DisableHorseModalComponent } from './disable-horse-modal.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RfxFormsModule } from '@rfx/ngx-forms';
import { HorseProfileStatus, UiCommonModule } from '@caballus/ui-common';
import { ToastService } from '@rfx/ngx-toast';
import { UiLibraryModule } from '@caballus/ui-library';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ModalController } from '@ionic/angular';
import { runOnPushChangeDetection } from '@ion-caballus/core/util';
import { HorseCache } from '../../caches/horse/horse.cache';
import { of } from 'rxjs';

const MockModalController = {
    dismiss: jest.fn()
};

const MockHorseCache = {
    disableHorseById: jest.fn(),
};

const MockToastService = {
    error: jest.fn()
};

describe('DisableHorseModalComponent', () => {
    let component: DisableHorseModalComponent;
    let fixture: ComponentFixture<DisableHorseModalComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [DisableHorseModalComponent],
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
                MatCheckboxModule
            ],
            providers: [
                { provide: ModalController, useValue: MockModalController },
                { provide: HorseCache, useValue: MockHorseCache },
                { provide: ToastService, useValue: MockToastService }
            ]
        })
            .compileComponents();
    }));

    beforeEach(async () => {
        fixture = TestBed.createComponent(DisableHorseModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        await runOnPushChangeDetection(fixture);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should dismiss with enable true when user enable', async () => {
        component.profileStatus = HorseProfileStatus.Active;
        MockHorseCache.disableHorseById.mockReturnValue(of({
            profileStatus: HorseProfileStatus.Disabled
        }))
        const button = fixture.debugElement.query(By.css('.end'));
        button.triggerEventHandler('click', null);
        await runOnPushChangeDetection(fixture);
        expect(MockModalController.dismiss).toHaveBeenCalledWith(expect.objectContaining({ confirm: true, profileStatus: HorseProfileStatus.Disabled }));
    });

    it('should dismiss with disable true when user goes back', async () => {
        component.profileStatus = HorseProfileStatus.Active;
        const button = fixture.debugElement.query(By.css('.go-back'));
        button.triggerEventHandler('click', null);
        await runOnPushChangeDetection(fixture);
        expect(MockModalController.dismiss).toHaveBeenCalledWith(expect.objectContaining({ confirm: false }));
    });
});
