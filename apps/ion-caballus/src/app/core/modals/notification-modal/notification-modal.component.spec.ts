import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationModalComponent } from './notification-modal.component';

import { ModalController } from '@ionic/angular';

class MockModalController {

}

describe('NotificationModalComponent', () => {
    let component: NotificationModalComponent;
    let fixture: ComponentFixture<NotificationModalComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [NotificationModalComponent],
            providers: [
                { provide: ModalController, useClass: MockModalController }
            ]
        })
        .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(NotificationModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
