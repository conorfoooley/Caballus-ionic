import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ElevationComponent } from './elevation.component';

describe('ElevationComponent', () => {
  let component: ElevationComponent;
  let fixture: ComponentFixture<ElevationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ElevationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ElevationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
