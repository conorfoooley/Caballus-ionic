import { async, ComponentFixture, TestBed, flush, fakeAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ToggleHorseToRideModalComponent } from './toggle-horse-to-ride-modal.component';
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
import { HorseForRide, RideSummary, Gait, RideCategory } from '@caballus/ui-common';
import { of } from 'rxjs';

const MockModalController = {
    dismiss: jest.fn()
};

const MockHorseForRide = new HorseForRide({
    _id: '0',
    commonName: 'Poo Bah',
    gaitsKilometersPerHour: {
        [Gait.Walk]: 0,
        [Gait.Lope]: 0,
        [Gait.Trot]: 0,
        [Gait.Gallop]: 0
    },
    rides: [
        new RideSummary({
            category: RideCategory.HorseWalker,
            riderName: 'Chesire Cat',
            distanceKilometers: 3.1,
            notes: 'The small brown fox jumped quickly over the lazy dog'
        }),
        new RideSummary({
            category: RideCategory.HorseWalker,
            riderName: 'Chesire Cat',
            distanceKilometers: 3.1,
            notes: 'The small brown fox jumped quickly over the lazy dog'
        }),
        new RideSummary({
            category: RideCategory.HorseWalker,
            riderName: 'Chesire Cat',
            distanceKilometers: 3.1,
            notes: 'The small brown fox jumped quickly over the lazy dog'
        })
    ]
});

describe('ToggleHorseToRideModalComponent', () => {
    let component: ToggleHorseToRideModalComponent;
    let fixture: ComponentFixture<ToggleHorseToRideModalComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ToggleHorseToRideModalComponent],
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
            providers: [{ provide: ModalController, useValue: MockModalController }]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ToggleHorseToRideModalComponent);
        component = fixture.componentInstance;
        component.add$ = of(true);
        component.horse$ = of(MockHorseForRide);
    });

    it('should create', fakeAsync(() => {
        flush();
        fixture.detectChanges();
        expect(component).toBeTruthy();
    }));

    it('should render the horses name', fakeAsync(() => {
        flush();
        fixture.detectChanges();
        const name = fixture.debugElement.query(By.css('h1'));
        expect(name.nativeElement.textContent).toBe('Poo Bah');
    }));

    it('should render a ride summary for each ride', fakeAsync(() => {
        flush();
        fixture.detectChanges();
        const rides = fixture.debugElement.queryAll(By.css('.ride'));
        expect(rides.length).toBe(MockHorseForRide.rides.length);
    }));

    it('should dismiss with true when confirm clicked', fakeAsync(() => {
        flush();
        fixture.detectChanges();
        const button = fixture.debugElement.query(By.css('button'));
        button.triggerEventHandler('click', null);
        expect(MockModalController.dismiss).toHaveBeenCalledWith(true);
    }));

    it('should dismiss with false when cancel clicked', fakeAsync(() => {
        flush();
        fixture.detectChanges();
        const button = fixture.debugElement.query(By.css('fa-icon'));
        button.triggerEventHandler('click', null);
        expect(MockModalController.dismiss).toHaveBeenCalledWith(false);
    }));
});
