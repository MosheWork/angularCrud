import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientGuidanceReportComponent } from './patient-guidance-report.component';

describe('PatientGuidanceReportComponent', () => {
  let component: PatientGuidanceReportComponent;
  let fixture: ComponentFixture<PatientGuidanceReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PatientGuidanceReportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PatientGuidanceReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
