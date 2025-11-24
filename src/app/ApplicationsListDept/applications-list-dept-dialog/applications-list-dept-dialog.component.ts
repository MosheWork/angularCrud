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
    this.form = this.fb.group({
      id: [null],
      appName: [''],
      companyName: [''],
      appDescription: [''],
      primaryReference: [''],
      secondaryReference: [''],
      remarks: [''],
      phones: [''],
      guides: ['']
    });
  
    // 👇 Fill all fields immediately from data
    if (data) {
      this.form.patchValue(data, { emitEvent: false });
    }
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

    this.http.post<any>(
      environment.apiUrl + 'ApplicationsListDept/UploadFile',
      formData
    ).subscribe(res => {
    
      const fileName = res.fileName ?? res.FileName;          // ✅ handle both
      const url       = res.url ?? res.Url;
      const original  = res.originalName ?? res.OriginalName;
    
      // store file name in DB (recommended)
      this.form.patchValue({ guides: fileName });
    
      // preview
      this.uploadedFileUrl  = url;
      this.uploadedFileName = original || fileName;
    
      input.value = '';
    }, err => {
      alert(err?.error || 'Upload failed');
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
    // Always read the form’s live values
    const v = this.form.value;
  
    const payload = {
      id: v.id,
      appName: (v.appName || '').trim(),
      companyName: (v.companyName || '').trim(),
      appDescription: (v.appDescription || '').trim(),
      primaryReference: (v.primaryReference || '').trim(),
      secondaryReference: (v.secondaryReference || '').trim(),
      remarks: (v.remarks || '').trim(),
      phones: (v.phones || '').trim(),
      guides: (v.guides || '').trim()
    };
  
    const endpoint = payload.id
      ? 'ApplicationsListDept/Update'
      : 'ApplicationsListDept/Insert';
  
    this.http.post(environment.apiUrl + endpoint, payload)
      .subscribe(() => this.dialogRef.close(true));
  }
  
  close(): void {
    this.dialogRef.close();
  }
}
