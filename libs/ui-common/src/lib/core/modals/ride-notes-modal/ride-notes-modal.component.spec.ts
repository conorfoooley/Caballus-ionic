import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RideNotesModalComponent } from './ride-notes-modal.component';

describe('RideNotesModalComponent', () => {
  let component: RideNotesModalComponent;
  let fixture: ComponentFixture<RideNotesModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RideNotesModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RideNotesModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
