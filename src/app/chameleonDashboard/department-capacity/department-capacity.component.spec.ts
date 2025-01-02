import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DepartmentCapacityComponent } from './department-capacity.component';

describe('DepartmentCapacityComponent', () => {
  let component: DepartmentCapacityComponent;
  let fixture: ComponentFixture<DepartmentCapacityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DepartmentCapacityComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DepartmentCapacityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
