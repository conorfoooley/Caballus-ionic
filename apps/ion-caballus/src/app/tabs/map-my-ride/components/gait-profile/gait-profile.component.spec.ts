import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GaitProfileComponent } from './gait-profile.component';

describe('GaitProfileComponent', () => {
  let component: GaitProfileComponent;
  let fixture: ComponentFixture<GaitProfileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GaitProfileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GaitProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
