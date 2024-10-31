import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HemoDialysisReportComponent } from './hemo-dialysis-report.component';

describe('HemoDialysisReportComponent', () => {
  let component: HemoDialysisReportComponent;
  let fixture: ComponentFixture<HemoDialysisReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HemoDialysisReportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HemoDialysisReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
