import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportEmployeesPerSectorComponent } from './report-employees-per-sector.component';

describe('ReportEmployeesPerSectorComponent', () => {
  let component: ReportEmployeesPerSectorComponent;
  let fixture: ComponentFixture<ReportEmployeesPerSectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReportEmployeesPerSectorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportEmployeesPerSectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
