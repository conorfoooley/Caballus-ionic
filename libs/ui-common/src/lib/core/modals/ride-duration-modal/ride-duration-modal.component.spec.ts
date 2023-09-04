import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RideDurationModalComponent } from './ride-duration-modal.component';

describe('RideDurationModalComponent', () => {
  let component: RideDurationModalComponent;
  let fixture: ComponentFixture<RideDurationModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RideDurationModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RideDurationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
