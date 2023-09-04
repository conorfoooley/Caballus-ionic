import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoViewer } from './video-viewer.component';

describe('VideoViewer', () => {
    let component: VideoViewer;
    let fixture: ComponentFixture<VideoViewer>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [VideoViewer]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(VideoViewer);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
