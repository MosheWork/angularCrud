import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcedureICD9ManagerDialogComponent } from './procedure-icd9-manager-dialog.component';

describe('ProcedureICD9ManagerDialogComponent', () => {
  let component: ProcedureICD9ManagerDialogComponent;
  let fixture: ComponentFixture<ProcedureICD9ManagerDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProcedureICD9ManagerDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProcedureICD9ManagerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
