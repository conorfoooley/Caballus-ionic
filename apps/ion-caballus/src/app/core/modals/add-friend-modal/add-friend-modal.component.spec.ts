import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddFriendModalComponent } from './add-friend-modal.component';

describe('AddFriendModalComponent', () => {
  let component: AddFriendModalComponent;
  let fixture: ComponentFixture<AddFriendModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddFriendModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddFriendModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
