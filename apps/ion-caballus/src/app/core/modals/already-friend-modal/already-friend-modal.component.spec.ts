import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AlreadyFriendModalComponent } from './already-friend-modal.component';

describe('AlreadyFriendModalComponent', () => {
  let component: AlreadyFriendModalComponent;
  let fixture: ComponentFixture<AlreadyFriendModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AlreadyFriendModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AlreadyFriendModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
