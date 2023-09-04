import { Component, Input } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RfxFormsModule } from '@rfx/ngx-forms';
import { UiCommonModule } from '@caballus/ui-common';
import { UiLibraryModule } from '@caballus/ui-library';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { HorseProfileGalleryComponent } from './horse-photo-gallery.component';
import { ToastService } from '@rfx/ngx-toast';
import { HorseCache, RideCache } from '@ion-caballus/core/caches';
import { runOnPushChangeDetection } from '@ion-caballus/core/util';
import { CapacitorPluginService, ModalService } from '@ion-caballus/core/services';
import { of } from 'rxjs';
import { take } from 'rxjs/operators';
import { HorseForRide, User, Ride, HorseIdentity, HorseService } from '@caballus/ui-common';
import { NgxsModule, Store } from '@ngxs/store';

const MockToastService = {
    error: jest.fn()
};
const MockHorseCache = {
    getHorsesForList: jest.fn(),
};


describe('HorseProfileGallery', () => {
    let component: HorseProfileGalleryComponent;
    let fixture: ComponentFixture<HorseProfileGalleryComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                HorseProfileGalleryComponent,
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
                MatCheckboxModule,
                NgxsModule.forRoot([])
            ],
            providers: [
                { provide: HorseCache, useValue: MockHorseCache },
                { provide: ToastService, useValue: MockToastService },
            ]
        })
        .compileComponents();

        const store: Store = TestBed.get(Store);
        store['select'] = jest.fn(() => of(new User()));
    }));

    const setupHelper = async (): Promise<void> => {
        fixture = TestBed.createComponent(HorseProfileGalleryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        await runOnPushChangeDetection(fixture);
    };

    beforeEach(() => {
    });

    it('should create', () => {
        setupHelper();
        expect(component).toBeTruthy();
    });
});
