import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DepartmentLoadByShiftComponent } from './department-load-by-shift.component';

describe('DepartmentLoadByShiftComponent', () => {
  let component: DepartmentLoadByShiftComponent;
  let fixture: ComponentFixture<DepartmentLoadByShiftComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DepartmentLoadByShiftComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DepartmentLoadByShiftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
