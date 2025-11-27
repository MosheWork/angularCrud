import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { finalize } from 'rxjs/operators';

export interface DiabetesSugerLabResult {
  patient: number;
  idNum: string;
  firstName: string;
  lastName: string;
  testCode: number;
  testName: string;
  result: string;
  numericResult?: number | null;
  units: string;
  resultDate: string; // or Date
}

@Component({
  selector: 'app-diabetes-suger-results-dialog',
  templateUrl: './diabetes-suger-lab-result.component.html',
  styleUrls: ['./diabetes-suger-lab-result.component.scss']
})
export class DiabetesSugerResultsDialogComponent implements OnInit {
  loading = false;
  labs: DiabetesSugerLabResult[] = [];

  displayedColumns: string[] = [
    'resultDate',
    'testCode',
    'testName',
    'result',
    'units',
    'numericResult'
  ];

  constructor(
    private http: HttpClient,
    private dialogRef: MatDialogRef<DiabetesSugerResultsDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { patient: number; name: string; idNum: string }
  ) {}

  ngOnInit(): void {
    this.loadLabs();
  }

  private loadLabs(): void {
    this.loading = true;
    this.http
      .get<DiabetesSugerLabResult[]>(
        `${environment.apiUrl}DiabetesDailyReport/Labs?patient=${this.data.patient}`
      )
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: res => (this.labs = res || []),
        error: err => {
          console.error('Error loading labs', err);
          this.labs = [];
        }
      });
  }

  close(): void {
    this.dialogRef.close();
  }

  getResultClass(value: number | null | undefined): Record<string, boolean> {
    if (value == null) {
      return {};
    }
    return {
      'danger-sugar': value > 180 || value < 70
    };
  }
  
}
