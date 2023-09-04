import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageViewer } from './image-viewer.component';

describe('ImageViewer', () => {
    let component: ImageViewer;
    let fixture: ComponentFixture<ImageViewer>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ImageViewer]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ImageViewer);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
