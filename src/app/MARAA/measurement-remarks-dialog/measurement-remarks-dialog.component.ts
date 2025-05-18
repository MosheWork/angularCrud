import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-measurement-remarks-dialog',
  templateUrl: './measurement-remarks-dialog.component.html',
  styleUrls: ['./measurement-remarks-dialog.component.scss']
})
export class MeasurementRemarksDialogComponent {
  remarks: string = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { id: number, remarks: string, entryUser: string },
    private dialogRef: MatDialogRef<MeasurementRemarksDialogComponent>,
    private http: HttpClient
  ) {
    this.remarks = data.remarks || '';
  }

  submit(): void {
    this.http.post(`${environment.apiUrl}/MeasurementDataMoshe/UpdateRemarks?id=${this.data.id}`, this.remarks, {
      headers: { 'Content-Type': 'text/plain' }  // important!
    }).subscribe({
      next: () => this.dialogRef.close(true),
      error: err => {
        console.error('Failed to update remarks', err);
        alert('שגיאה בשמירת ההערה');
      }
    });
  }
  
}
