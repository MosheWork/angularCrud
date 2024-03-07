import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { environment } from '../../../environments/environment'

export interface Reports {
  rowid: string;
  linkDescription: string;
  linkStatus: string;
  reportName: string;
  linkAdress: string;
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

  ngOnInit(): void {
    this.initializeForm();
  }
  constructor(
    private dialogRef: MatDialogRef<UpdateReportComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Reports,
    private formBuilder: FormBuilder, // Assuming you're using FormBuilder
    private http: HttpClient // If you're making an HTTP request directly from the component
  ) {
    // Initialize your form here, using data to populate the fields
    this.initializeForm();
  }

  initializeForm(): void {
    this.updateForm = this.formBuilder.group({
      rowid: [this.data.rowid, Validators.required],
      linkDescription: [this.data.linkDescription, Validators.required],
      linkStatus: [this.data.linkStatus, Validators.required],
      reportName: [this.data.reportName, Validators.required],
      linkAdress: [this.data.linkAdress, Validators.required],
    });

    // Add the subscription to linkStatus value changes here
    this.updateForm.get('linkStatus')!.valueChanges.subscribe((value) => {
      if (value === '0') {
        // Assuming '0' represents "Not Active"
        const confirmed = confirm(
          'Are you sure you want to change the status to Not Active?'
        );
        if (!confirmed) {
          // User did not confirm, revert the value
          this.updateForm
            .get('linkStatus')!
            .setValue(this.data.linkStatus, { emitEvent: false });
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
            this.updateForm.value.rowid,
          this.updateForm.value
        )
        .subscribe(
          (response) => {
            this.dialogRef.close(true); // Indicate success
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
