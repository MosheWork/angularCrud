import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiabetesDailyReportComponent } from './diabetes-daily-report.component';

describe('DiabetesDailyReportComponent', () => {
  let component: DiabetesDailyReportComponent;
  let fixture: ComponentFixture<DiabetesDailyReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DiabetesDailyReportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DiabetesDailyReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
