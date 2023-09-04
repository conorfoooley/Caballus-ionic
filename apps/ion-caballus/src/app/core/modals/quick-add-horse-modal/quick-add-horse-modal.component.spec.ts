import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { ModalController } from '@ionic/angular';
import { HorseCache } from '../../caches/horse/horse.cache';
import { QuickAddHorseModalComponent } from './quick-add-horse-modal.component';
import { runOnPushChangeDetection } from '../../util';
import { HorseForRide } from '@caballus/ui-common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RfxFormsModule } from '@rfx/ngx-forms';
import { UiCommonModule } from '@caballus/ui-common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { UiLibraryModule } from '@caballus/ui-library';
import { CommonModule } from '@angular/common';
import { ToastService } from '@rfx/ngx-toast';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';

const MockToastService = {

}

const MockHorseCache = {
    createHorseForRide: jest.fn()
};

const MockModalController = {
    dismiss: jest.fn()
};

describe('QuickAddHorseModalComponent', () => {
    let component: QuickAddHorseModalComponent;
    let fixture: ComponentFixture<QuickAddHorseModalComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [QuickAddHorseModalComponent],
            imports: [
                RouterTestingModule,
                BrowserAnimationsModule,
                CommonModule,
                UiLibraryModule,
                FormsModule,
                ReactiveFormsModule,
                RfxFormsModule,
                UiCommonModule,
                MatInputModule,
                MatFormFieldModule,
                MatIconModule,
                MatProgressSpinnerModule,
                MatCheckboxModule
            ],
            providers: [
                FormBuilder,
                { provide: HorseCache, useValue: MockHorseCache },
                { provide: ModalController, useValue: MockModalController },
                { provide: ToastService, useValue: MockToastService }
            ]
        })
        .compileComponents();
    }));

    beforeEach(async () => {
        fixture = TestBed.createComponent(QuickAddHorseModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        await runOnPushChangeDetection(fixture);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should invoke cache create with a new horse, and dimiss with data', async () => {
        MockHorseCache.createHorseForRide.mockReturnValueOnce(
            of({ horses: [new HorseForRide({ commonName: 'Triple A', _id: '0' })], newId: '0'})
        )
        const input = fixture.debugElement.query(By.css('input')).nativeElement;
        input.value = 'Triple A';
        input.dispatchEvent(new Event('input'));
        const button = fixture.debugElement.query(By.css('.spinner')).nativeElement;
        button.click();
        await runOnPushChangeDetection(fixture);
        expect(MockHorseCache.createHorseForRide)
            .toHaveBeenCalledWith(
                expect.objectContaining(
                    new HorseForRide({ commonName: 'Triple A' })
                )
            );
        expect(MockModalController.dismiss)
            .toHaveBeenCalledWith(
                expect.objectContaining({
                    horses: [new HorseForRide({ commonName: 'Triple A', _id: '0' })],
                    newId: '0'
                })
            );
    });

    it('should dismiss with null when cancel clicked', async () => {
        const cancel = fixture.debugElement.query(By.css('fa-icon')).nativeElement;
        cancel.click();
        await runOnPushChangeDetection(fixture);
        expect(MockModalController.dismiss).toHaveBeenCalledWith(null);
    });
});
