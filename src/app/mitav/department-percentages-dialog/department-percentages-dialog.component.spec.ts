import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DepartmentPercentagesDialogComponent } from './department-percentages-dialog.component';

describe('DepartmentPercentagesDialogComponent', () => {
  let component: DepartmentPercentagesDialogComponent;
  let fixture: ComponentFixture<DepartmentPercentagesDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DepartmentPercentagesDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DepartmentPercentagesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
