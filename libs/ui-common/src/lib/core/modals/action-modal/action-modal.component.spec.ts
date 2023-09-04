import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionButtonModal } from './action-modal.component';

describe('ActionButtonModal', () => {
  let component: ActionButtonModal;
  let fixture: ComponentFixture<ActionButtonModal>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ActionButtonModal ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActionButtonModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
