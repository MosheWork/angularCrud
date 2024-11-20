import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PalliativePatientsReportComponent } from './palliative-patients-report.component';

describe('PalliativePatientsReportComponent', () => {
  let component: PalliativePatientsReportComponent;
  let fixture: ComponentFixture<PalliativePatientsReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PalliativePatientsReportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PalliativePatientsReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
