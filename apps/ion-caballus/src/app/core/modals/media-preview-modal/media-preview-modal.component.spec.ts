import { CommonModule } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { runOnPushChangeDetection } from '@ion-caballus/core/util';
import { IonicModule, ModalController } from '@ionic/angular';
import { MediaPreviewModalComponent } from './media-preview-modal.component';

const MockModalController = {
    dismiss: jest.fn()
};

describe('PinnedMediaPreviewModalComponent', () => {
    let component: MediaPreviewModalComponent;
    let fixture: ComponentFixture<MediaPreviewModalComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [MediaPreviewModalComponent],
            imports: [CommonModule, IonicModule, MatIconModule],
            providers: [{ provide: ModalController, useValue: MockModalController }]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MediaPreviewModalComponent);
        component = fixture.componentInstance;
    });

    it('should create', async done => {
        fixture.detectChanges();
        await runOnPushChangeDetection(fixture);

        expect(component).toBeTruthy();
        done();
    });
});
