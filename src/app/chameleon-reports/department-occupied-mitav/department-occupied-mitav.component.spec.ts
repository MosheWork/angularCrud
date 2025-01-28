import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DepartmentOccupiedMITAVComponent } from './department-occupied-mitav.component';

describe('DepartmentOccupiedMITAVComponent', () => {
  let component: DepartmentOccupiedMITAVComponent;
  let fixture: ComponentFixture<DepartmentOccupiedMITAVComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DepartmentOccupiedMITAVComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DepartmentOccupiedMITAVComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
