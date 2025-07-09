import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PciReportComponent } from './pci-report.component';

describe('PciReportComponent', () => {
  let component: PciReportComponent;
  let fixture: ComponentFixture<PciReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PciReportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PciReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
