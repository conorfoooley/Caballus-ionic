import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigureGpsParametersModalComponent } from './configure-gps-parameters-modal.component';

describe('ConfigureGpsParametersModalComponent', () => {
  let component: ConfigureGpsParametersModalComponent;
  let fixture: ComponentFixture<ConfigureGpsParametersModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfigureGpsParametersModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigureGpsParametersModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
