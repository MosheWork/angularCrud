import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SkinIntegrityReportComponent } from './skin-integrity-report.component';

describe('SkinIntegrityReportComponent', () => {
  let component: SkinIntegrityReportComponent;
  let fixture: ComponentFixture<SkinIntegrityReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SkinIntegrityReportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SkinIntegrityReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
