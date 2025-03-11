import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserCRMComponent } from './user-crm.component';

describe('UserCRMComponent', () => {
  let component: UserCRMComponent;
  let fixture: ComponentFixture<UserCRMComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserCRMComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserCRMComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
