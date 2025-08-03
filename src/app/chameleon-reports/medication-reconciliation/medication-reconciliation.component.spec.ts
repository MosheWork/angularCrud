import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedicationReconciliationComponent } from './medication-reconciliation.component';

describe('MedicationReconciliationComponent', () => {
  let component: MedicationReconciliationComponent;
  let fixture: ComponentFixture<MedicationReconciliationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MedicationReconciliationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MedicationReconciliationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
