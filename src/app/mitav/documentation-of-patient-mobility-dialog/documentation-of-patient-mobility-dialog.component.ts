import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-documentation-of-patient-mobility-dialog',
  templateUrl: './documentation-of-patient-mobility-dialog.component.html',
  styleUrls: ['./documentation-of-patient-mobility-dialog.component.scss']
})
export class DocumentationOfPatientMobilityDialogComponent implements OnInit {
  admissionDetails: any[] = [];
  isLoading: boolean = true;

  constructor(
    private http: HttpClient,
    public dialogRef: MatDialogRef<DocumentationOfPatientMobilityDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { admissionNo: string }
  ) {}

  ngOnInit(): void {
    this.fetchAdmissionDetails();
  }

  fetchAdmissionDetails(): void {
    const apiUrl = `${environment.apiUrl}MITAVMobility/GetDepartmentsWithMobilityRecords?admissionNo=${this.data.admissionNo}`;
    this.http.get<any[]>(apiUrl).subscribe(
      (response) => {
        this.admissionDetails = response;
        this.isLoading = false;
      },
      (error) => {
        console.error('Error fetching admission details:', error);
        this.isLoading = false;
      }
    );
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
