import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoViewerModalComponent } from './video-viewer-modal.component';

describe('VideoViewerModalComponent', () => {
    let component: VideoViewerModalComponent;
    let fixture: ComponentFixture<VideoViewerModalComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [VideoViewerModalComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(VideoViewerModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
