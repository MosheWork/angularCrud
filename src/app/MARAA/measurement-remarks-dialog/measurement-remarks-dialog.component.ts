import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthenticationService } from '../../services/authentication-service/authentication-service.component';

@Component({
  selector: 'app-measurement-remarks-dialog',
  templateUrl: './measurement-remarks-dialog.component.html',
  styleUrls: ['./measurement-remarks-dialog.component.scss']
})
export class MeasurementRemarksDialogComponent implements OnInit {
  remarks: string = '';
  subtract: boolean = false;
  aprovedMabar: boolean = false;

  loginUserName: string = '';
  showSubtractMeta: boolean = false;
  showApproveMeta: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<MeasurementRemarksDialogComponent>,
    private http: HttpClient,
    private authenticationService: AuthenticationService
  ) {
    this.remarks      = data.Remarks ?? data.remarks ?? '';
    this.subtract     = (data.Subtract ?? data.subtract) ?? false;
    this.aprovedMabar = (data.AprovedMabar ?? data.aprovedMabar) ?? false;
  }
  

  ngOnInit(): void {
    this.authenticationService.getAuthentication().subscribe(res => {
      this.loginUserName = res.message.split('\\')[1].toUpperCase();
    });
  }

  onSubtractChange(): void {
    this.showSubtractMeta = this.subtract;
  }

  onApproveChange(): void {
    this.showApproveMeta = this.aprovedMabar;
  }

  async submit(): Promise<void> {
    const measurmentId = this.data?.Measurment_ID;
    const caseNumber   = this.data?.Case_Number;
  
    if (!measurmentId || !caseNumber) {
      console.error('[submit] Missing Measurment_ID/Case_Number', this.data);
      alert('חסר Measurment_ID או Case_Number');
      return;
    }
  
    if (!this.loginUserName) {
      await new Promise<void>((resolve) => {
        this.authenticationService.getAuthentication().subscribe({
          next: (res) => {
            this.loginUserName = (res?.message?.split('\\')[1] || '').toUpperCase();
            resolve();
          },
          error: () => resolve()
        });
      });
    }
  
    const payload: any = {
      Measurment_ID: String(measurmentId),
      Case_Number:   String(caseNumber),
      Remarks:       this.remarks?.trim() || null, // backend treats NULL specially
      Subtract:      !!this.subtract,
      AprovedMabar:  !!this.aprovedMabar,
      EntryUser:     this.loginUserName || null
    };
  
    if (this.subtract)      payload.EntryUserSubtract     = this.loginUserName || null;
    if (this.aprovedMabar)  payload.EntryUserAprovedMabar = this.loginUserName || null;
  
    console.log('[MeasurementRemarksDialog] POST payload:', payload);
  
    const url = `${environment.apiUrl}`.replace(/\/$/, '') + '/MeasurementDataMoshe/UpdateRemarks';
    this.http.post(url, payload).subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        console.error('❌ Failed to update remarks', err, payload);
        alert('שגיאה בשמירת ההערה');
      }
    });
  }
  
  
  
  
}
