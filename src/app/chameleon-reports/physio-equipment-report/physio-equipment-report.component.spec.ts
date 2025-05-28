import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhysioEquipmentReportComponent } from './physio-equipment-report.component';

describe('PhysioEquipmentReportComponent', () => {
  let component: PhysioEquipmentReportComponent;
  let fixture: ComponentFixture<PhysioEquipmentReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PhysioEquipmentReportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PhysioEquipmentReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
