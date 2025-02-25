import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HospPhoneByDepartmentComponent } from './hosp-phone-by-department.component';

describe('HospPhoneByDepartmentComponent', () => {
  let component: HospPhoneByDepartmentComponent;
  let fixture: ComponentFixture<HospPhoneByDepartmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HospPhoneByDepartmentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HospPhoneByDepartmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
