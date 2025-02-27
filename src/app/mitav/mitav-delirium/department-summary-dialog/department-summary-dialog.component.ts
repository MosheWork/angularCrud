import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-department-summary-dialog',
  templateUrl: './department-summary-dialog.component.html',
  styleUrls: ['./department-summary-dialog.component.scss']
})
export class DepartmentSummaryDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DepartmentSummaryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  closeDialog(): void {
    this.dialogRef.close();
  }
}
