import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment'

@Component({
  selector: 'app-add-report',
  templateUrl: './add-report.component.html',
  styleUrls: ['./add-report.component.scss'],
})
export class AddReportComponent implements OnInit {
  linkStatusOptions = [
    { label: 'Active', value: '1' },
    { label: 'Not Active', value: '0' },
  ];

  ngOnInit(): void {}
  newRowForm = new FormGroup({
    LinkDescription: new FormControl('', [Validators.required]), // Validators can be adjusted as needed
    LinkStatus: new FormControl('1', [Validators.required]),
    ReportName: new FormControl('', [Validators.required]),
    LinkAdress: new FormControl('', [Validators.required]),
  });

  constructor(
    public dialogRef: MatDialogRef<AddReportComponent>,
    private http: HttpClient
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.newRowForm.valid) {
      this.http
        .post(
          environment.apiUrl + 'ChameleonOnlineReportsAPI',
          this.newRowForm.value
        )
        .subscribe(
          (response) => {
            // If the post is successful, close the dialog and pass the response.
            this.dialogRef.close(response);
          },
          (error) => {
            // Handle the error without closing the dialog
            console.error('Error:', error);
          }
        );
      console.log(this.newRowForm.value);
    }
  }
}
