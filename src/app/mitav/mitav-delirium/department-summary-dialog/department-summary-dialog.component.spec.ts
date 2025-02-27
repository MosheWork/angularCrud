import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DepartmentSummaryDialogComponent } from './department-summary-dialog.component';

describe('DepartmentSummaryDialogComponent', () => {
  let component: DepartmentSummaryDialogComponent;
  let fixture: ComponentFixture<DepartmentSummaryDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DepartmentSummaryDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DepartmentSummaryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
