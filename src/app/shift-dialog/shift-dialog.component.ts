import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-shift-dialog',
  templateUrl: './shift-dialog.component.html',  // Reference to the new HTML file
  styleUrls: ['./shift-dialog.component.scss']

})
export class ShiftDialogComponent {
  shiftForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ShiftDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.shiftForm = this.fb.group({
      employeeName: [''],
      shiftTime: [''],
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    const shift = this.shiftForm.value;
    this.dialogRef.close(shift); // Return the shift data
  }
}
