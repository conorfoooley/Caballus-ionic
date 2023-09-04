import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MyHorsesPageComponent } from './my-horses-page.component';

describe('MyHorsesPageComponent', () => {
  let component: MyHorsesPageComponent;
  let fixture: ComponentFixture<MyHorsesPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MyHorsesPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MyHorsesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
