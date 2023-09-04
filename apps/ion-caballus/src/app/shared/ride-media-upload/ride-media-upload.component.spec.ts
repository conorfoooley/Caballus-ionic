import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, fakeAsync, flush, TestBed } from '@angular/core/testing';
import { MediaSelectionSource, ModalService } from '@caballus/ui-common';
import {
    CapacitorPluginService,
    ModalService as CoreModalService,
    ThumbnailService
} from '@ion-caballus/core/services';
import { ToastService } from '@rfx/ngx-toast';
import { of } from 'rxjs';
import { RideMediaUploadComponent } from './ride-media-upload.component';

describe('RideMediaUploadComponent', () => {
    let component: RideMediaUploadComponent;
    let fixture: ComponentFixture<RideMediaUploadComponent>;
    const MockModalService = {
        media: jest.fn(),
        mediaPreview: jest.fn()
    };
    const MockToastService = {
        info: jest.fn()
    };
    const MockThumbnailService = {
        base64ToDataUrl: jest.fn().mockReturnValue('thumbnail/url'),
        getPhotoThumbnail: jest.fn().mockReturnValue(of('thumbnail'))
    };
    const MockCapacitorPluginService = {
        getPhoto: jest.fn().mockReturnValue(
            of({
                saved: false,
                format: 'jpeg',
                base64String: 'photo'
            })
        ),
        checkPermissions: jest.fn()
    };

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [RideMediaUploadComponent],
            providers: [
                { provide: ModalService, useValue: MockModalService },
                { provide: CoreModalService, useValue: MockModalService },
                { provide: ToastService, useValue: MockToastService },
                { provide: ThumbnailService, useValue: MockThumbnailService },
                { provide: CapacitorPluginService, useValue: MockCapacitorPluginService }
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        MockModalService.mediaPreview.mockClear();
        MockModalService.media.mockClear();
        MockToastService.info.mockClear();
        MockThumbnailService.base64ToDataUrl.mockClear();
        MockThumbnailService.getPhotoThumbnail.mockClear();
        MockCapacitorPluginService.getPhoto.mockClear();
        MockCapacitorPluginService.checkPermissions.mockClear();

        fixture = TestBed.createComponent(RideMediaUploadComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should show gallery or photo prompt', fakeAsync(() => {
        MockModalService.media.mockReturnValueOnce({
            afterClosed: () => of(undefined)
        });

        component.onTapAttachedMedia(0);
        flush();

        expect(MockModalService.media).toHaveBeenCalled();
    }));

    it('should check camera / gallery permissions', fakeAsync(() => {
        MockModalService.media.mockReturnValueOnce({
            afterClosed: () => of(MediaSelectionSource.PICK_PHOTO)
        });
        MockCapacitorPluginService.checkPermissions.mockReturnValueOnce(of(false));

        component.onTapAttachedMedia(0);
        flush();

        expect(MockCapacitorPluginService.checkPermissions).toHaveBeenCalled();
    }));

    it('should add pinned media', done => {
        MockModalService.media.mockReturnValueOnce({
            afterClosed: () => of(MediaSelectionSource.PICK_PHOTO)
        });
        MockCapacitorPluginService.checkPermissions.mockReturnValueOnce(of(true));
        let initComplete = false;

        const sub = component.thumbnails$.subscribe(_ => {
            // Component emits thumbnails in onInit handler, so we omit first emit
            if (initComplete === false) {
                initComplete = true;
                return;
            }
            expect(MockCapacitorPluginService.getPhoto).toHaveBeenCalled();
            expect(component['_pinnedMedia'][0].photo.base64String).toBe('photo');
            done();
            sub.unsubscribe();
        });

        component.onTapAttachedMedia(0);
    });

    it('should remove pinned media', done => {
        MockModalService.media.mockReturnValueOnce({
            afterClosed: () => of(MediaSelectionSource.TAKE_PHOTO)
        });
        MockCapacitorPluginService.checkPermissions.mockReturnValueOnce(of(true));
        // Remove media
        MockModalService.mediaPreview.mockReturnValueOnce(of(true));
        let initComplete = false;

        const sub = component.thumbnails$.subscribe(_ => {
            // Component emits thumbnails in onInit handler, so we omit first emit
            if (initComplete === false) {
                initComplete = true;
                return;
            } else if (component['_pinnedMedia'].filter(a => a !== null).length) {
                expect(MockCapacitorPluginService.getPhoto).toHaveBeenCalled();
                expect(component['_pinnedMedia'][0].photo.base64String).toBe('photo');
            } else {
                expect(component['_pinnedMedia'][0]).toBeNull();
                done();
                sub.unsubscribe();
            }
        });

        // This emits when media is added so we "tap" media again to remove it
        const outputSub = component.media.subscribe(media => {
            if (media[0]) {
                component.onTapAttachedMedia(0);
                outputSub.unsubscribe();
            }
        });

        component.onTapAttachedMedia(0);
    });
});
