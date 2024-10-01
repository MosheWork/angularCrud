import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserLogPerCaseNumberReportComponent } from './user-log-per-case-number-report.component';

describe('UserLogPerCaseNumberReportComponent', () => {
  let component: UserLogPerCaseNumberReportComponent;
  let fixture: ComponentFixture<UserLogPerCaseNumberReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserLogPerCaseNumberReportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserLogPerCaseNumberReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
