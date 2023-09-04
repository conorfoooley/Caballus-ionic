import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HorseHealthModalComponent } from './horse-health-modal.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RfxFormsModule } from '@rfx/ngx-forms';
import { HorseHealthSimple, HorseHealthType, UiCommonModule } from '@caballus/ui-common';
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
import { ModalService } from '@ion-caballus/core/services';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';

const MockModalController = {
    dismiss: jest.fn()
};

const MockHorseCache = {
    deleteHorseById: jest.fn(),
    deleteHorseHealthDocument: jest.fn(),
    editHorseHealth: jest.fn(),
    createHorseHealth: jest.fn()

};

const MockModalService = {
    deleteHorseHealthModal: jest.fn(),
};

const MockToastService = {
    error: jest.fn(),
    success: jest.fn()
};

function DataTransfer() {
    this.items = new Set();
    this.files = this.items;
}

const exitingHorseHealth = {
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
};

const FileListItems = (files): FileList => {
    const b = new DataTransfer();
    for (let i = 0, len = files.length; i < len; i++) b.items.add(files[i])
    return b.files as FileList;
}

describe('HorseHealthModalComponent For Add', () => {
    let component: HorseHealthModalComponent;
    let fixture: ComponentFixture<HorseHealthModalComponent>;
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [HorseHealthModalComponent],
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
                MatDatepickerModule,
                MatMomentDateModule
            ],
            providers: [
                { provide: ModalController, useValue: MockModalController },
                { provide: HorseCache, useValue: MockHorseCache },
                { provide: ToastService, useValue: MockToastService },
                { provide: ModalService, useValue: MockModalService },
                FormBuilder
            ]
        })
            .compileComponents();
    }));

    beforeEach(async () => {
        fixture = TestBed.createComponent(HorseHealthModalComponent);
        component = fixture.componentInstance;
        component.horseHealth =new HorseHealthSimple({})
        component.horseId = '6100a78d5f635611f95d22b2';
        component.horseHealthType = HorseHealthType.Health;
        await runOnPushChangeDetection(fixture);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should dismiss with deleted false when user goes back', async () => {
        const button = fixture.debugElement.query(By.css('.go-back'));
        button.triggerEventHandler('click', null);
        await runOnPushChangeDetection(fixture);
        expect(MockModalController.dismiss).toHaveBeenCalledWith(expect.objectContaining({ deleted: false, saved: false }));
    });

    it('should call error popup if selected file is invalid type', async () => {
        const files = [
            new File(['content'], 'sample1.invalid'),
            new File(['abc'], 'sample2.invalid')
        ];
        MockToastService.error.mockReturnValue(null);
        component.onUpload({
            target: {
                files: FileListItems(files)
            }
        } as any);
        await runOnPushChangeDetection(fixture);
        expect(MockToastService.error).toHaveBeenCalledWith('Allowed filesized (50Mb) exceeded or an incorrect format and will not be uploaded. Upload failed');
    });

    it('should call error popup if selected more then 2 files', async () => {
        const files = [
            new File(['content'], 'sample1.txt'),
            new File(['abc'], 'sample2.txt'),
            new File(['xyz'], 'sample3.txt')
        ];
        component.onUpload({
            target: {
                files: FileListItems(files)
            }
        } as any);
        await runOnPushChangeDetection(fixture);
        expect(MockToastService.error).toHaveBeenCalledWith('Allowed maximum 2 attachments');
    });


    it('should set all uploaded file into newDocumentInstance with modified display name', async () => {
        const files = [
            new File(['content'], 'sample-super-big-text-name.txt'),
            new File(['abc'], 'sample.txt')
        ];
        component.onUpload({
            target: {
                files: FileListItems(files)
            }
        } as any);
        await runOnPushChangeDetection(fixture);
        expect(component.newDocuments$.getValue()[0].displayName).toEqual('sample-super-b...txt');
        expect(component.newDocuments$.getValue()[1].displayName).toEqual('sample.txt');
    });

    it('should delete uploaded file into newDocumentInstance', async () => {
        const files = [
            new File(['content'], 'sample-super-big-text-name.txt'),
            new File(['abc'], 'sample.txt')
        ];
        component.onUpload({
            target: {
                files: FileListItems(files)
            }
        } as any);
        await runOnPushChangeDetection(fixture);
        component.deleteNewDocument(0);
        await runOnPushChangeDetection(fixture);
        expect(component.newDocuments$.getValue()[0].displayName).toEqual('sample.txt');
    });

    it('should save new horse health based on giving data and modal success with set saved', async () => {
        MockHorseCache.createHorseHealth.mockReturnValue(of(null));
        component.horseHealthForm.patchValue({
            date: new Date(),
            notes: "Test",
        });
        await runOnPushChangeDetection(fixture);
        component.onSave();
        await runOnPushChangeDetection(fixture);
        expect(MockModalController.dismiss).toBeCalledWith(expect.objectContaining({ saved: true }));
    });
});


describe('HorseHealthModalComponent For Edit/Delete', () => {
    let component: HorseHealthModalComponent;
    let fixture: ComponentFixture<HorseHealthModalComponent>;
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [HorseHealthModalComponent],
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
                MatDatepickerModule,
                MatMomentDateModule
            ],
            providers: [
                { provide: ModalController, useValue: MockModalController },
                { provide: HorseCache, useValue: MockHorseCache },
                { provide: ToastService, useValue: MockToastService },
                { provide: ModalService, useValue: MockModalService },
                FormBuilder
            ]
        })
            .compileComponents();
    }));

    beforeEach(async () => {
        fixture = TestBed.createComponent(HorseHealthModalComponent);
        component = fixture.componentInstance;
        component.horseHealth = exitingHorseHealth as HorseHealthSimple;
        component.horseId = '6100a78d5f635611f95d22b2';
        component.horseHealthType = HorseHealthType.Health;
        await runOnPushChangeDetection(fixture);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set existing document and existing detail if provide by input', async () => {
        component.ngOnInit();
        await runOnPushChangeDetection(fixture);
        expect(component.existingDocuments$.getValue().length).toEqual(exitingHorseHealth.documents.length);
    });

    it('should call delete document service method on delete existing document', async () => {
        MockHorseCache.deleteHorseHealthDocument.mockReturnValue(of(null));
        component.deleteExistingDocument(exitingHorseHealth.documents[0]._id);
        await runOnPushChangeDetection(fixture);
        expect(component.existingDocuments$.getValue().length).toEqual(exitingHorseHealth.documents.length - 1);
    });

    it('should not call success toast method on  delete horse health modal return success', async () => {
        MockModalService.deleteHorseHealthModal.mockReturnValue(of({
            deleted: false
        }));
        component.deleteHorseHealth();
        await runOnPushChangeDetection(fixture);
        expect(MockToastService.success).not.toBeCalled();
    });

    it('should call success toast method on  delete horse health modal return success', async () => {
        MockModalService.deleteHorseHealthModal.mockReturnValue(of({
            deleted: true
        }));
        component.deleteHorseHealth();
        await runOnPushChangeDetection(fixture);
        expect(MockToastService.success).toBeCalledWith('Record has been deleted');
    });

    it('should save new horse health based on giving data and modal success with set saved', async () => {
        MockHorseCache.editHorseHealth.mockReturnValue(of(null));
        component.horseHealthForm.patchValue({
            date: new Date(),
            notes: "Test",
        });
        await runOnPushChangeDetection(fixture);
        component.onSave();
        await runOnPushChangeDetection(fixture);
        expect(MockModalController.dismiss).toBeCalledWith(expect.objectContaining({ saved: true }));
    });
});

