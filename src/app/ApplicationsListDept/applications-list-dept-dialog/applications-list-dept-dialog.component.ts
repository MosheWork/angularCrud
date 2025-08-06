import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';



@Component({
  selector: 'app-applications-list-dept-dialog',
  templateUrl: './applications-list-dept-dialog.component.html',
  styleUrls: ['./applications-list-dept-dialog.component.scss']
})
export class ApplicationsListDeptDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ApplicationsListDeptDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient
  ) {
    this.form = this.fb.group({
      ID: [data?.ID || null],
      AppName: [data?.AppName || '', Validators.required],
      CompanyName: [data?.CompanyName || ''],
      AppDescription: [data?.AppDescription || ''],
      PrimaryReference: [data?.PrimaryReference || ''],
      SecondaryReference: [data?.SecondaryReference || ''],
      Remarks: [data?.Remarks || ''],
      Phones: [data?.Phones || ''],
      Guides: [data?.Guides || '']
    });
  }

  save() {
    const url = this.form.value.ID
      ? 'ApplicationsListDept/Update'
      : 'ApplicationsListDept/Insert';

    this.http.post(environment.apiUrl + url, this.form.value).subscribe(() => {
      this.dialogRef.close(true);
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
