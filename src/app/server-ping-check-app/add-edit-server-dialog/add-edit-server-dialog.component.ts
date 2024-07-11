import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-add-edit-server-dialog',
  templateUrl: './add-edit-server-dialog.component.html',
  styleUrls: ['./add-edit-server-dialog.component.scss']
})
export class AddEditServerDialogComponent {
  serverForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<AddEditServerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) {
    this.serverForm = this.fb.group({
      Hostname: [data.server ? data.server.Hostname : '', Validators.required],
      Description: [data.server ? data.server.Description : ''],
      Type: [data.server ? data.server.Type : '', Validators.required], // New field
      CreatedBy: [data.server ? data.server.CreatedBy : '', Validators.required]
    });
  }

  onSave(): void {
    if (this.serverForm.valid) {
      console.log('Form data to be saved:', this.serverForm.value); // Add this line
      this.dialogRef.close(this.serverForm.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
