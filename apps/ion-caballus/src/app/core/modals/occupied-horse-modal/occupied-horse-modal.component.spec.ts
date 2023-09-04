import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { OccupiedHorseModalComponent } from './occupied-horse-modal.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RfxFormsModule } from '@rfx/ngx-forms';
import { UiCommonModule } from '@caballus/ui-common';
import { UiLibraryModule } from '@caballus/ui-library';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ModalController } from '@ionic/angular';
import { HorseForRide } from '@caballus/ui-common';
import { of } from 'rxjs';
import { runOnPushChangeDetection } from '@ion-caballus/core/util';

const MockModalController = {
    dismiss: jest.fn()
};

describe('OccupiedHorseModalComponent', () => {
    let component: OccupiedHorseModalComponent;
    let fixture: ComponentFixture<OccupiedHorseModalComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [OccupiedHorseModalComponent],
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
                { provide: ModalController, useValue: MockModalController }
            ]
        })
        .compileComponents();
    }));

    beforeEach(async () => {
        fixture = TestBed.createComponent(OccupiedHorseModalComponent);
        component = fixture.componentInstance;
        component.horse$ = of(new HorseForRide({ commonName: 'Moe', _id: '0' }));
        fixture.detectChanges();
        await runOnPushChangeDetection(fixture);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should dismiss with include when user confirms', async () => {
        const button = fixture.debugElement.query(By.css('.include'));
        button.triggerEventHandler('click', null);
        await runOnPushChangeDetection(fixture);
        expect(MockModalController.dismiss).toHaveBeenCalledWith(expect.objectContaining({ id: '0', include: true }));
    });

    it('should dismiss with exclude when user declines', async () => {
        const button = fixture.debugElement.query(By.css('.exclude'));
        button.triggerEventHandler('click', null);
        await runOnPushChangeDetection(fixture);
        expect(MockModalController.dismiss).toHaveBeenCalledWith(expect.objectContaining({ id: '0', include: false }));
    });
});
