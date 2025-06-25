import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DrugSurgeryReportComponent } from './drug-surgery-report.component';

describe('DrugSurgeryReportComponent', () => {
  let component: DrugSurgeryReportComponent;
  let fixture: ComponentFixture<DrugSurgeryReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DrugSurgeryReportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DrugSurgeryReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
