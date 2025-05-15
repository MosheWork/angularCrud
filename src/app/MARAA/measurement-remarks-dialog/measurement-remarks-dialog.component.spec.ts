import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeasurementRemarksDialogComponent } from './measurement-remarks-dialog.component';

describe('MeasurementRemarksDialogComponent', () => {
  let component: MeasurementRemarksDialogComponent;
  let fixture: ComponentFixture<MeasurementRemarksDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MeasurementRemarksDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MeasurementRemarksDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
