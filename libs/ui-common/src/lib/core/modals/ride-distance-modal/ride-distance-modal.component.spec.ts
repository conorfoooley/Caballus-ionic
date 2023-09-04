import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RideDistanceModalComponent } from './ride-distance-modal.component';

describe('RideDistanceModalComponent', () => {
  let component: RideDistanceModalComponent;
  let fixture: ComponentFixture<RideDistanceModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RideDistanceModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RideDistanceModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
