import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LabResultsDetailDialogComponent } from './lab-results-detail-dialog.component';

describe('LabResultsDetailDialogComponent', () => {
  let component: LabResultsDetailDialogComponent;
  let fixture: ComponentFixture<LabResultsDetailDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LabResultsDetailDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LabResultsDetailDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
