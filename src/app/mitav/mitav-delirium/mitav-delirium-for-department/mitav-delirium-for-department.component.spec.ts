import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MitavDeliriumForDepartmentComponent } from './mitav-delirium-for-department.component';

describe('MitavDeliriumForDepartmentComponent', () => {
  let component: MitavDeliriumForDepartmentComponent;
  let fixture: ComponentFixture<MitavDeliriumForDepartmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MitavDeliriumForDepartmentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MitavDeliriumForDepartmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
