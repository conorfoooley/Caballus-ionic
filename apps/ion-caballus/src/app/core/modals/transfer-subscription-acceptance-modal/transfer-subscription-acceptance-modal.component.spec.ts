import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TransferSubscriptionAcceptanceModalComponent } from './transfer-subscription-acceptance-modal.component';

describe('TransferSubscriptionAcceptanceModalComponent', () => {
  let component: TransferSubscriptionAcceptanceModalComponent;
  let fixture: ComponentFixture<TransferSubscriptionAcceptanceModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TransferSubscriptionAcceptanceModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TransferSubscriptionAcceptanceModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
