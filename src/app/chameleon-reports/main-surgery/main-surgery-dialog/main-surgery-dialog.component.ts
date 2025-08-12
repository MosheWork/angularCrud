import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

// main-surgery-dialog.component.ts
export interface MainSurgeryDialogData {
  CaseNumber: string;
  PatientName: string;
  DoingText?: string;
  MainSurgeonNameFirst1?: string;
  MainSurgeonNameLast1?: string;

  MainSurgeonEmail1?: string;
  MainSurgeonCell1?: string;
  MainSurgeonNameFirst2?: string;
  MainSurgeonNameLast2?: string;
  MainSurgeonEmail2?: string;
  MainSurgeonCell2?: string;
}


@Component({
  selector: 'app-main-surgery-dialog',
  templateUrl: './main-surgery-dialog.component.html',
  styleUrls: ['./main-surgery-dialog.component.scss']
})
export class MainSurgeryDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<MainSurgeryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MainSurgeryDialogData
  ) {}

  close() {
    this.dialogRef.close();
  }
}
