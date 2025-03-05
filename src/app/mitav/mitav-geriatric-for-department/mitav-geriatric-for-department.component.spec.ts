import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MitavGeriatricForDepartmentComponent } from './mitav-geriatric-for-department.component';

describe('MitavGeriatricForDepartmentComponent', () => {
  let component: MitavGeriatricForDepartmentComponent;
  let fixture: ComponentFixture<MitavGeriatricForDepartmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MitavGeriatricForDepartmentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MitavGeriatricForDepartmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
