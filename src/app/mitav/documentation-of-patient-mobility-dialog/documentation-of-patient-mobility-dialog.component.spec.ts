import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentationOfPatientMobilityDialogComponent } from './documentation-of-patient-mobility-dialog.component';

describe('DocumentationOfPatientMobilityDialogComponent', () => {
  let component: DocumentationOfPatientMobilityDialogComponent;
  let fixture: ComponentFixture<DocumentationOfPatientMobilityDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DocumentationOfPatientMobilityDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentationOfPatientMobilityDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
