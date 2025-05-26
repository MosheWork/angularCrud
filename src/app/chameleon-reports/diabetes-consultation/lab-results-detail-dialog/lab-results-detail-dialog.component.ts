import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-lab-results-detail-dialog',
  templateUrl: './lab-results-detail-dialog.component.html',
  styleUrls: ['./lab-results-detail-dialog.component.scss']
})
export class LabResultsDetailDialogComponent implements OnInit {
  labResults: any[] = [];
  loading = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      Patient: number;
      AdmissionDate: string;
      FirstName: string;
      LastName: string;
      IdNum: string;
      Admission_No: string;
    },
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.fetchLabResults();
  }

  fetchLabResults(): void {
    const params = new HttpParams()
      .set('patient', this.data.Patient)
      .set('admissionDate', this.data.AdmissionDate);

    this.http.get<any[]>(`${environment.apiUrl}DiabetesConsultation/LabResultsForDialog`, { params })
      .subscribe({
        next: (results) => {
          this.labResults = results;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error fetching lab results:', err);
          this.loading = false;
        }
      });
  }
}
