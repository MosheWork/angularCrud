import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface DiabetesSugerLabResult {
  patient: number;
  idNum: string;
  firstName: string;
  lastName: string;
  testCode: number;
  testName: string;
  result: string;
  numericResult: number | null;
  units: string;
  resultDate: string; // ISO string from backend
}

@Component({
  selector: 'app-diabetes-suger-results-dialog',
  templateUrl: './diabetes-suger-lab-result.component.html',
  styleUrls: ['./diabetes-suger-lab-result.component.scss']
})
export class DiabetesSugerResultsDialogComponent implements OnInit {
  loading = false;
  labResults: DiabetesSugerLabResult[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { patient: number; name: string; idNum: string },
    private http: HttpClient,
    private dialogRef: MatDialogRef<DiabetesSugerResultsDialogComponent>
  ) {}

  ngOnInit(): void {
    this.loading = true;

    this.http
      .get<DiabetesSugerLabResult[]>(
        `${environment.apiUrl}DiabetesDailyReport/Labs?patient=${this.data.patient}`
      )
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: res => {
          this.labResults = res || [];
        },
        error: err => {
          console.error('Error loading sugar results', err);
          alert('שגיאה בטעינת בדיקות סוכר');
        }
      });
  }

  close(): void {
    this.dialogRef.close();
  }
}
