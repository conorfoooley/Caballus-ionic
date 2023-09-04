import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TransferSubscriptionComponent } from './update-subscription-payment-method-modal.component';

describe('TransferSubscriptionComponent', () => {
    let component: TransferSubscriptionComponent;
    let fixture: ComponentFixture<TransferSubscriptionComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [TransferSubscriptionComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TransferSubscriptionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
