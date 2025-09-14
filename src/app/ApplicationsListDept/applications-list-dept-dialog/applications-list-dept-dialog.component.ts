import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-applications-list-dept-dialog',
  templateUrl: './applications-list-dept-dialog.component.html',
  styleUrls: ['./applications-list-dept-dialog.component.scss']
})
export class ApplicationsListDeptDialogComponent implements OnInit {
  form: FormGroup;

  // one guide only
  uploadedFileUrl: string | null = null;
  uploadedFileName: string | null = null;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ApplicationsListDeptDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient
  ) {
    this.form = this.fb.group({
      ID: [data?.ID || null],
      appName: [data?.appName || '', Validators.required],
      companyName: [data?.companyName || ''],
      AppDescription: [data?.AppDescription || ''],
      PrimaryReference: [data?.PrimaryReference || ''],
      SecondaryReference: [data?.SecondaryReference || ''],
      Remarks: [data?.Remarks || ''],
      Phones: [data?.Phones || ''],
      Guides: [data?.Guides || ''] // single absolute URL (string) or empty
    });
  }

  ngOnInit(): void {
    // hydrate existing guide (edit mode)
    const g = this.form.value.Guides as string;
    if (g && g.trim()) {
      this.uploadedFileUrl = g.trim();
      this.uploadedFileName = g.split('/').pop() || 'guide';
    }
  }

  onFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    // ask if replacing current guide
    if (this.uploadedFileUrl) {
      const ok = window.confirm('כבר שמור מדריך. להחליף אותו במדריך החדש?');
      if (!ok) { input.value = ''; return; }
    }

    const formData = new FormData();
    formData.append('file', input.files[0]); // single file

    this.http.post<{ FileName: string; OriginalName: string; Url: string }>(
      environment.apiUrl + 'ApplicationsListDept/UploadFile',
      formData
    ).subscribe(res => {
      // persist single guide URL
      this.uploadedFileUrl = res.Url;
      this.uploadedFileName = res.OriginalName || res.FileName;
      this.form.patchValue({ Guides: res.Url });

      // allow re-select same file later
      input.value = '';
    }, _ => {
      input.value = '';
    });
  }

  onDeleteGuide() {
    if (!this.uploadedFileUrl) return;
    const ok = window.confirm('למחוק את המדריך הנוכחי?');
    if (!ok) return;

    // UI clear; backend will remove old file on Update (per your controller logic)
    this.uploadedFileUrl = null;
    this.uploadedFileName = null;
    this.form.patchValue({ Guides: '' });
  }

  save() {
    const url = this.form.value.ID
      ? 'ApplicationsListDept/Update'
      : 'ApplicationsListDept/Insert';

    this.http.post(environment.apiUrl + url, this.form.value).subscribe(() => {
      this.dialogRef.close(true);
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
