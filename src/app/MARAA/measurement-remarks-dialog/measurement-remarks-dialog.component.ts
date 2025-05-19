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
  subtract: boolean = false;
  aprovedMabar: boolean = false;


  constructor(
    @Inject(MAT_DIALOG_DATA)  public data: {
      Measurment_ID: string;
      Case_Number: string;
      Remarks: string;
      Subtract: boolean;
      AprovedMabar: boolean;
  
      MeasurementShortDesc?: string;
      Date?: string;
      Mone?: number;
      Mechane?: number;
      Department?: string;
    },
    public dialogRef: MatDialogRef<MeasurementRemarksDialogComponent>,
    private http: HttpClient
  ) {
    this.remarks = data.Remarks || '';
    this.subtract = data.Subtract || false;
    this.aprovedMabar = data.AprovedMabar ?? false; // ✅ this is missing
  }
  

  submit(): void {
    const payload = {
      Measurment_ID: this.data.Measurment_ID,
      Case_Number: this.data.Case_Number,
      Remarks: this.remarks,
      Subtract: this.subtract,
      AprovedMabar: this.aprovedMabar
    };

    this.http.post(`${environment.apiUrl}/MeasurementDataMoshe/UpdateRemarks`, payload)
      .subscribe({
        
        next: () => this.dialogRef.close(true),
        error: err => {
          console.error('❌ Failed to update remarks', err);
          alert('שגיאה בשמירת ההערה');
        }

        
      });
  }
}

