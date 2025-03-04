import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-mitav-grade-list-dialog',
  templateUrl: './mitav-grade-list-dialog.component.html',
  styleUrls: ['./mitav-grade-list-dialog.component.scss']
})
export class MitavGradeListDialogComponent implements OnInit {
  isLoading: boolean = true;
  gradesList: any[] = [];

  constructor(
    private http: HttpClient,
    public dialogRef: MatDialogRef<MitavGradeListDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { Admission_Medical_Record: string; FollowUp_Medical_Record: string; Release_Medical_Record: string }
  ) {}

  ngOnInit(): void {
    this.fetchGrades();
  }

  fetchGrades() {
    const requestData = {
      MedicalRecords: [
        this.data.Admission_Medical_Record,
        this.data.FollowUp_Medical_Record,
        this.data.Release_Medical_Record
      ].filter(record => record !== null) // Remove null values
    };

    this.http.post<any[]>(`${environment.apiUrl}MitavDelirumForDepartment/GradeList`, requestData).subscribe(
      (response) => {
        this.gradesList = response;
        this.isLoading = false;
      },
      (error) => {
        console.error('Error fetching grade list:', error);
        this.isLoading = false;
      }
    );
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
