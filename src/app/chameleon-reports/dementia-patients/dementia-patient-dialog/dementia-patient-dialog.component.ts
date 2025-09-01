import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dementia-patient-dialog',
  templateUrl: './dementia-patient-dialog.component.html',
  styleUrls: ['./dementia-patient-dialog.component.scss']
})
export class DementiaPatientDialogComponent {
  // ⬇️ lower-first keys
  dialogColumns: string[] = ['entryDate', 'iCD9', 'diagnosisName', 'descriptionEntryDate', 'heading', 'descriptionCognitive'];

  // ⬇️ labels mapped to the new lower-first keys
  columnLabels: { [key: string]: string } = {
    entryDate: 'תאריך דיווח',
    iCD9: 'קוד ICD9',
    diagnosisName: 'אבחנה',
    descriptionEntryDate: 'תאריך תיעוד',
    heading: 'שם הרכיב',
    descriptionCognitive: 'מלל'
  };

  constructor(
    public dialogRef: MatDialogRef<DementiaPatientDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  closeDialog(): void {
    this.dialogRef.close();
  }
}
