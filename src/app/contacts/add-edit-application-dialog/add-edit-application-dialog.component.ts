import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-add-edit-application-dialog',
  templateUrl: './add-edit-application-dialog.component.html',
  styleUrls: ['./add-edit-application-dialog.component.scss']
})
export class AddEditApplicationDialogComponent implements OnInit {
  form: FormGroup;
  isEdit: boolean;
  usersInCharge: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<AddEditApplicationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.isEdit = data.isEdit;
    this.form = this.fb.group({
      ApplicationName: [data.application?.ApplicationName || '', Validators.required],
      ApplicationDescription: [data.application?.ApplicationDescription || '', Validators.required],
      CompanyName: [data.application?.CompanyName || '', Validators.required],
      UsedBy: [data.application?.UsedBy || '', Validators.required],
      UserInChargeIDs: [data.application?.UserInChargeIDs || [], Validators.required],
      ApplicationNameInEnglish: [data.application?.ApplicationNameInEnglish || '', Validators.required]
    });
  }

  ngOnInit(): void {
    this.fetchUsersInCharge();
  }

  fetchUsersInCharge(): void {
    this.http.get<any[]>(`${environment.apiUrl}ContactsInfoAPI/GetAllUsersInCharge`).subscribe(data => {
      this.usersInCharge = data;
    }, error => {
      console.error('Error fetching users in charge:', error);
    });
  }

  save(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
