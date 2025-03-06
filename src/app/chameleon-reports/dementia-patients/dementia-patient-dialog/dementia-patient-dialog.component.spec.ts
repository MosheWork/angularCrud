import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DementiaPatientDialogComponent } from './dementia-patient-dialog.component';

describe('DementiaPatientDialogComponent', () => {
  let component: DementiaPatientDialogComponent;
  let fixture: ComponentFixture<DementiaPatientDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DementiaPatientDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DementiaPatientDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
