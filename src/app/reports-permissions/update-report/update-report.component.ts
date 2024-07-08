import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';

export interface Reports {
  Rowid: string;
  LinkDescription: string;
  LinkStatus: string;
  ReportName: string;
  LinkAdress: string;
}

@Component({
  selector: 'app-update-report',
  templateUrl: './update-report.component.html',
  styleUrls: ['./update-report.component.scss'],
})
export class UpdateReportComponent implements OnInit {
  updateForm!: FormGroup;

  linkStatusOptions = [
    { label: 'Active', value: '1' },
    { label: 'Not Active', value: '0' },
  ];

  constructor(
    private dialogRef: MatDialogRef<UpdateReportComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Reports,
    private formBuilder: FormBuilder,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.updateForm = this.formBuilder.group({
      Rowid: [this.data.Rowid, Validators.required],
      LinkDescription: [this.data.LinkDescription, Validators.required],
      LinkStatus: [this.data.LinkStatus, Validators.required],
      ReportName: [this.data.ReportName, Validators.required],
      LinkAdress: [this.data.LinkAdress, Validators.required],
    });

    this.updateForm.get('LinkStatus')!.valueChanges.subscribe((value) => {
      if (value === '0') {
        const confirmed = confirm(
          'Are you sure you want to change the status to Not Active?'
        );
        if (!confirmed) {
          this.updateForm
            .get('LinkStatus')!
            .setValue(this.data.LinkStatus, { emitEvent: false });
        }
      }
    });
  }

  onSubmit(): void {
    if (this.updateForm.valid) {
      this.http
        .put(
          environment.apiUrl +
            'ChameleonOnlineReportsAPI/' +
            this.updateForm.value.Rowid,
          this.updateForm.value
        )
        .subscribe(
          (response) => {
            this.dialogRef.close(true);
          },
          (error) => {
            console.error('Error updating report:', error);
          }
        );
      console.log(this.updateForm.value);
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
