import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-phone-call-dialog',
  templateUrl: './phone-call-dialog.component.html',
  styleUrls: ['./phone-call-dialog.component.scss']
})
export class PhoneCallDialogComponent {
  callForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<PhoneCallDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) {
    this.callForm = this.fb.group({
      caseManagerStatus: [data.CaseManagerStatus || ''],
      caseManagerCategory: [data.CaseManagerCategory || ''],
      caseManagerUpdate: [data.CaseManagerUpdate || new Date()],
      caseManagerRemarks: [data.CaseManagerRemarks || '']
    });
  }

  save() {
    this.dialogRef.close(this.callForm.value);
  }

  close() {
    this.dialogRef.close();
  }
}
