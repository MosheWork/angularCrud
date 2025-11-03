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
  showPersonalMeta = false;           // ✅ NEW

  // --- NEW: Personal Request
  personalRequest: boolean = false;

  isNBenShimon: boolean = false;
  loginUserName: string = '';
  showSubtractMeta: boolean = false;
  showApproveMeta: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<MeasurementRemarksDialogComponent>,
    private http: HttpClient,
    private authenticationService: AuthenticationService
  ) {
    this.remarks         = data.Remarks ?? data.remarks ?? '';
    this.subtract        = (data.Subtract ?? data.subtract) ?? false;
    this.aprovedMabar    = (data.AprovedMabar ?? data.aprovedMabar) ?? false;

    // --- NEW: init personal request from row data (support both casings)
    this.personalRequest = (data.PersonalRequest ?? data.personalRequest) ?? false; // ✅ NEW
  }

  ngOnInit(): void {
    this.authenticationService.getAuthentication().subscribe(res => {
      this.loginUserName = res.message.split('\\')[1].toUpperCase();
      this.isNBenShimon = this.loginUserName === 'NBENSHIMON';
    });
  }

  onSubtractChange(): void { this.showSubtractMeta = this.subtract; }
  onApproveChange(): void { this.showApproveMeta = this.aprovedMabar; }

  // --- NEW
  onPersonalChange(): void { this.showPersonalMeta = this.personalRequest; } // ✅ NEW

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
      Remarks:       this.remarks?.trim() || null,
      Subtract:      !!this.subtract,
      // מאושר מבר – רק ל-NBENSHIMON, אחרת נשמר הערך המקורי מהשורה
      AprovedMabar:  this.isNBenShimon
                      ? !!this.aprovedMabar
                      : (this.data.AprovedMabar ?? this.data.aprovedMabar) ?? false,

      // --- NEW: PersonalRequest always editable
      PersonalRequest: !!this.personalRequest,

      EntryUser: this.loginUserName || null
    };

    if (this.subtract)        payload.EntryUserSubtract         = this.loginUserName || null;
    if (this.aprovedMabar)    payload.EntryUserAprovedMabar     = this.loginUserName || null;
    // --- NEW: audit personal request
    if (this.personalRequest) payload.EntryUserPersonalRequest   = this.loginUserName || null;

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
