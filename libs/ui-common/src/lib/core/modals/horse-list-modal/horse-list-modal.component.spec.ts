import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HorseListModalComponent } from './horse-list-modal.component';

describe('HorseListModalComponent', () => {
  let component: HorseListModalComponent;
  let fixture: ComponentFixture<HorseListModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HorseListModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HorseListModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
