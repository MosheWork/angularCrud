import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DepartmentLoadDashboardComponent } from './department-load-dashboard.component';

describe('DepartmentLoadDashboardComponent', () => {
  let component: DepartmentLoadDashboardComponent;
  let fixture: ComponentFixture<DepartmentLoadDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DepartmentLoadDashboardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DepartmentLoadDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
