import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FriendActionModalComponent } from './friend-action-modal.component';

describe('FriendActionModalComponent', () => {
    let component: FriendActionModalComponent;
    let fixture: ComponentFixture<FriendActionModalComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [FriendActionModalComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(FriendActionModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
