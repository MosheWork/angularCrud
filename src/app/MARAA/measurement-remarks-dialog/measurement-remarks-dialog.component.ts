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
    // accept both lower-case and legacy cased inputs
    this.remarks = data.remarks ?? data.Remarks ?? '';
    this.subtract = data.subtract ?? data.Subtract ?? false;
    this.aprovedMabar = data.aprovedMabar ?? data.AprovedMabar ?? false;
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

  submit(): void {
    // normalize possible incoming keys for id/case
    const measId =
      this.data.measurment_id ??
      this.data.measurment_ID ??
      this.data.measurementCode ??
      this.data.measurementCode ??
      '';

    const caseNum =
      this.data.case_number ??
      this.data.Case_Number ??
      this.data.caseNumber ??
      this.data.CaseNumber ??
      '';

    // keep API payload keys as originally expected by backend
    const payload: any = {
      Measurment_ID: measId,
      Case_Number: caseNum,
      Remarks: this.remarks,
      Subtract: this.subtract,
      AprovedMabar: this.aprovedMabar,
      EntryUser: this.loginUserName
    };

    if (this.subtract) {
      payload.EntryUserSubtract = this.loginUserName;
    }
    if (this.aprovedMabar) {
      payload.EntryUserAprovedMabar = this.loginUserName;
    }

    this.http.post(`${environment.apiUrl}/MeasurementDataMoshe/UpdateRemarks`, payload).subscribe({
      next: () => this.dialogRef.close(true),
      error: err => {
        console.error('❌ Failed to update remarks', err);
        alert('שגיאה בשמירת ההערה');
      }
    });
  }
}
