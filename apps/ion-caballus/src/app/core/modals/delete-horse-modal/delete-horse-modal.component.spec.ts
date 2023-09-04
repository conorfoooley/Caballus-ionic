import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DeleteHorseModalComponent } from './delete-horse-modal.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RfxFormsModule } from '@rfx/ngx-forms';
import { UiCommonModule } from '@caballus/ui-common';
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
    deleteHorseById: jest.fn(),
};

const MockToastService = {
    error: jest.fn()
};

describe('DeleteHorseModalComponent', () => {
    let component: DeleteHorseModalComponent;
    let fixture: ComponentFixture<DeleteHorseModalComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [DeleteHorseModalComponent],
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
        fixture = TestBed.createComponent(DeleteHorseModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        await runOnPushChangeDetection(fixture);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should dismiss with deleted true when user delete', async () => {
        MockHorseCache.deleteHorseById.mockReturnValue(of(undefined))
        const button = fixture.debugElement.query(By.css('.end'));
        button.triggerEventHandler('click', null);
        await runOnPushChangeDetection(fixture);
        expect(MockModalController.dismiss).toHaveBeenCalledWith(expect.objectContaining({ deleted: true }));
    });

    it('should dismiss with deleted false when user goes back', async () => {
        const button = fixture.debugElement.query(By.css('.go-back'));
        button.triggerEventHandler('click', null);
        await runOnPushChangeDetection(fixture);
        expect(MockModalController.dismiss).toHaveBeenCalledWith(expect.objectContaining({ deleted: false }));
    });
});
