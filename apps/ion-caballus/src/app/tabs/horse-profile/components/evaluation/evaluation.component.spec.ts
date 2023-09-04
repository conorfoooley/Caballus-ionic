import { async, ComponentFixture, TestBed, tick } from '@angular/core/testing';
import { EvaluationComponent } from './evaluation.component';
import { ToastService } from '@rfx/ngx-toast';
import { BehaviorSubject, of } from 'rxjs';
import { UiCommonModule, User } from '@caballus/ui-common';
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
import { HorseHealthType } from '@caballus/common';
import { MatExpansionModule } from '@angular/material/expansion';

const MockHorseId = '6100a78d5f635611f95d22b2';

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
    getHorseEvaluationByHorseId: jest.fn()
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

}


describe('EvaluationComponent', () => {
    let component: EvaluationComponent;
    let fixture: ComponentFixture<EvaluationComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                EvaluationComponent
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
        fixture = TestBed.createComponent(EvaluationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        await runOnPushChangeDetection(fixture);
    };

    beforeEach(() => {
        MockHorseCache.getHorseEvaluationByHorseId.mockReturnValue(of(MockHorseHealths))
    });

    it('should create', async () => {
        setupHelper();
        expect(component).toBeTruthy();
    });
});
