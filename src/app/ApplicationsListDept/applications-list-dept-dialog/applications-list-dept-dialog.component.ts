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

  // preview-only (we store fileName in DB, but keep a URL to show)
  uploadedFileUrl: string | null = null;
  uploadedFileName: string | null = null;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ApplicationsListDeptDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient
  ) {
    // tolerate either lowerCamel (front) or Pascal/ALLCAPS (back) coming in
    const row = data ?? {};
    const norm = {
      id:              row.id ?? row.Id ?? row.ID ?? null,
      appName:         row.appName ?? row.AppName ?? '',
      companyName:     row.companyName ?? row.CompanyName ?? '',
      appDescription:  row.appDescription ?? row.AppDescription ?? '',
      primaryReference:row.primaryReference ?? row.PrimaryReference ?? '',
      secondaryReference: row.secondaryReference ?? row.SecondaryReference ?? '',
      remarks:         row.remarks ?? row.Remarks ?? '',
      phones:          row.phones ?? row.Phones ?? '',
      guides:          row.guides ?? row.Guides ?? ''   // DB stores only one guide (string)
    };

    this.form = this.fb.group({
      id: [norm.id],
      appName: [norm.appName, Validators.required],
      companyName: [norm.companyName],
      appDescription: [norm.appDescription],
      primaryReference: [norm.primaryReference],
      secondaryReference: [norm.secondaryReference],
      remarks: [norm.remarks],
      phones: [norm.phones],
      guides: [norm.guides] // file name or absolute URL
    });
  }

  ngOnInit(): void {
    const g = (this.form.value.guides || '').toString().trim();
    if (g) {
      // If it's already an absolute URL, use it; else show the served URL
      const isAbs = /^https?:\/\//i.test(g);
      this.uploadedFileUrl = isAbs
        ? g
        : `${environment.apiUrl}ApplicationsListDept/Guide?fileName=${encodeURIComponent(g)}`;
      this.uploadedFileName = decodeURIComponent(g.split('/').pop() || g);
    }
  }

  onFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    if (this.uploadedFileUrl) {
      const ok = window.confirm('כבר שמור מדריך. להחליף אותו במדריך החדש?');
      if (!ok) { input.value = ''; return; }
    }

    const formData = new FormData();
    formData.append('file', input.files[0]);

    this.http.post<{ FileName: string; OriginalName: string; Url: string }>(
      environment.apiUrl + 'ApplicationsListDept/UploadFile',
      formData
    ).subscribe(res => {
      // ✅ DB should store just the file name
      this.form.patchValue({ guides: res.FileName });

      // UI preview uses the served URL
      this.uploadedFileUrl = res.Url;
      this.uploadedFileName = res.OriginalName || res.FileName;

      input.value = '';
    }, _ => {
      input.value = '';
    });
  }

  onDeleteGuide() {
    if (!this.uploadedFileUrl) return;
    const ok = window.confirm('למחוק את המדריך הנוכחי?');
    if (!ok) return;

    this.uploadedFileUrl = null;
    this.uploadedFileName = null;
    this.form.patchValue({ guides: '' });
  }

  private buildPayload() {
    // trim a few important fields
    const v = this.form.value;
    return {
      id: v.id,
      appName: (v.appName || '').trim(),
      companyName: (v.companyName || '').trim(),
      appDescription: (v.appDescription || '').trim(),
      primaryReference: (v.primaryReference || '').trim(),
      secondaryReference: (v.secondaryReference || '').trim(),
      remarks: (v.remarks || '').trim(),
      phones: (v.phones || '').trim(),
      guides: (v.guides || '').trim()   // file name or absolute url
    };
  }

  save() {
    const payload = this.buildPayload();
    const endpoint = payload.id ? 'ApplicationsListDept/Update' : 'ApplicationsListDept/Insert';

    this.http.post(environment.apiUrl + endpoint, payload)
      .subscribe(() => this.dialogRef.close(true));
  }

  close(): void {
    this.dialogRef.close();
  }
}
