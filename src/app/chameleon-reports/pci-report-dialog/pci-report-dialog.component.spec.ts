import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PciReportDialogComponent } from './pci-report-dialog.component';

describe('PciReportDialogComponent', () => {
  let component: PciReportDialogComponent;
  let fixture: ComponentFixture<PciReportDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PciReportDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PciReportDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
