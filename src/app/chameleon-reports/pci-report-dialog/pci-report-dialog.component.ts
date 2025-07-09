import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-pci-report-dialog',
  templateUrl: './pci-report-dialog.component.html',
  styleUrls: ['./pci-report-dialog.component.scss']
})
export class PCIreportDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    public dialogRef: MatDialogRef<PCIreportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.form = this.fb.group({
      remark: ['']
    });
  }

  saveRemark() {
    console.log('📌 Form value:', this.form.value);
  
    const payload = {
      CaseNumber: this.data.CaseNumber,
      Remark: this.form.value.remark,   // ✅ מה־Form
      EntryUser: this.data.EntryUser    // ✅ מגיע מה־Parent
    };
  
    console.log('📌 Payload to send:', payload);
  
    this.http.post(`${environment.apiUrl}PCIreport/AddRemark`, payload)
      .subscribe(() => {
        alert('נשמר בהצלחה!');
        this.dialogRef.close(true);
      }, error => {
        console.error(error);
        alert('שגיאה בשמירה');
      });
  }
  
  
  
}
