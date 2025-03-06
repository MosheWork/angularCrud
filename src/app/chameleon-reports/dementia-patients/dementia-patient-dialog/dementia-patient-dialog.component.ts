import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dementia-patient-dialog',
  templateUrl: './dementia-patient-dialog.component.html',
  styleUrls: ['./dementia-patient-dialog.component.scss']
})
export class DementiaPatientDialogComponent {
  dialogColumns: string[] = ['EntryDate', 'ICD9', 'DiagnosisName', 'DescriptionEntryDate','heading', 'DescriptionCognitive'];

  columnLabels: { [key: string]: string } = {
    'EntryDate': 'תאריך דיווח',
    'ICD9': 'קוד ICD9',
    'DiagnosisName': 'אבחנה',
    'DescriptionEntryDate': 'תאריך תיעוד',
    'heading': ' שם הרכיב',
    'DescriptionCognitive': ' מלל'
  };

  constructor(
    public dialogRef: MatDialogRef<DementiaPatientDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  closeDialog(): void {
    this.dialogRef.close();
  }
}
