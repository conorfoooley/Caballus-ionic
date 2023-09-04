import { async, ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HorseSelectBannerComponent } from './horse-select-banner.component';
import { RouterTestingModule } from '@angular/router/testing';
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
import { HorseCache } from '@ion-caballus/core/caches';
import { ModalService } from '@ion-caballus/core/services';
import { HorseForRide } from '@caballus/ui-common';
import { of } from 'rxjs';
import { runOnPushChangeDetection } from '@ion-caballus/core/util';
import { ToastService } from '@rfx/ngx-toast';
import { FormControl } from '@angular/forms';

const MockHorseCache = {
    getHorsesForRide: jest.fn()
};
const MockModalService = {
    toggleHorseToRide: jest.fn()
};
const MockToastService = {

};

describe('HorseSelectBannerComponent', () => {
    let component: HorseSelectBannerComponent;
    let fixture: ComponentFixture<HorseSelectBannerComponent>;

    const setupHelper = (): void => {
        fixture = TestBed.createComponent(HorseSelectBannerComponent);
        component = fixture.componentInstance;
        component.ride$ = of(null);
        component.control = new FormControl([]);
    };

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [HorseSelectBannerComponent],
            imports: [
                RouterTestingModule,
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
            ],
            providers: [
                { provide: HorseCache, useValue: MockHorseCache },
                { provide: ModalService, useValue: MockModalService },
                { provide: ToastService, useValue: MockToastService }
            ]
        })
        .compileComponents();
    }));

    beforeEach(() => {
        MockHorseCache.getHorsesForRide.mockReset();
    });

    it('should create', () => {
        MockHorseCache.getHorsesForRide.mockReturnValueOnce(of([]));
        setupHelper();
        expect(component).toBeTruthy();
    });

    it('should render a button for each horse and for quick add', async () => {
        MockHorseCache.getHorsesForRide.mockReturnValueOnce(of([
            new HorseForRide({ _id: '0', commonName: 'A' }),
            new HorseForRide({ _id: '1', commonName: 'B' })
        ]));
        setupHelper();
        fixture.detectChanges();
        await runOnPushChangeDetection(fixture, 2);
        const buttons = fixture.debugElement.queryAll(By.css('.banner-button'));
        expect(buttons.length).toBe(3);
        const labels = fixture.debugElement.queryAll(By.css('.label'));
        expect(labels[0].nativeElement.textContent).toBe('A');
        expect(labels[1].nativeElement.textContent).toBe('B');
        expect(labels[2].nativeElement.textContent).toBe('Quick Add');
    });

    it('should toggle horse selection when a button is clicked', async () => {
        MockHorseCache.getHorsesForRide.mockReturnValueOnce(of([
            new HorseForRide({ _id: '2', commonName: 'C' }),
            new HorseForRide({ _id: '3', commonName: 'D' })
        ]));
        MockModalService.toggleHorseToRide.mockReturnValue(of(true));
        setupHelper();
        fixture.detectChanges();
        await runOnPushChangeDetection(fixture, 2);
        component.toggle(0);
        await runOnPushChangeDetection(fixture);
        expect(component.control.value.length).toBe(1);
        component.toggle(0);
        await runOnPushChangeDetection(fixture);
        expect(component.control.value.length).toBe(0);
    });

    it('should not show the search bar when less than ten options', async () => {
        MockHorseCache.getHorsesForRide.mockReturnValueOnce(of([]));
        setupHelper();
        fixture.detectChanges();
        await runOnPushChangeDetection(fixture, 2);
        const search = fixture.debugElement.query(By.css('.search'));
        expect(search).toBeFalsy();
    });

    it('should show the search bar when ten or more options', async () => {
        MockHorseCache.getHorsesForRide.mockReturnValueOnce(of([
            new HorseForRide({ _id: '0', commonName: 'A' }),
            new HorseForRide({ _id: '1', commonName: 'B' }),
            new HorseForRide({ _id: '2', commonName: 'C' }),
            new HorseForRide({ _id: '3', commonName: 'D' }),
            new HorseForRide({ _id: '4', commonName: 'E' }),
            new HorseForRide({ _id: '5', commonName: 'F' }),
            new HorseForRide({ _id: '6', commonName: 'G' }),
            new HorseForRide({ _id: '7', commonName: 'H' }),
            new HorseForRide({ _id: '8', commonName: 'I' }),
            new HorseForRide({ _id: '9', commonName: 'J' })
        ]));
        setupHelper();
        fixture.detectChanges();
        await runOnPushChangeDetection(fixture, 2);
        const search = fixture.debugElement.query(By.css('.search'));
        expect(search).toBeTruthy();
    });

    it('should narrow available options when search is used', async () => {
        MockHorseCache.getHorsesForRide.mockReturnValueOnce(of([
            new HorseForRide({ _id: '0', commonName: 'A' }),
            new HorseForRide({ _id: '1', commonName: 'B' }),
            new HorseForRide({ _id: '2', commonName: 'C' }),
            new HorseForRide({ _id: '3', commonName: 'D' }),
            new HorseForRide({ _id: '4', commonName: 'E' }),
            new HorseForRide({ _id: '5', commonName: 'F' }),
            new HorseForRide({ _id: '6', commonName: 'G' }),
            new HorseForRide({ _id: '7', commonName: 'H' }),
            new HorseForRide({ _id: '8', commonName: 'I' }),
            new HorseForRide({ _id: '9', commonName: 'J' })
        ]));
        setupHelper();
        fixture.detectChanges();
        await runOnPushChangeDetection(fixture, 2);
        const input = fixture.debugElement.query(By.css('input')).nativeElement;
        input.value = 'A';
        input.dispatchEvent(new Event('input'));
        await runOnPushChangeDetection(fixture, 2);
        const options = fixture.debugElement.queryAll(By.css('.banner-button'));
        // one for match, one for add new horse button
        expect(options.length).toBe(2);
    });
});
