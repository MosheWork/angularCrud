import { Component } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from '../../environments/environment'; // adjust path if needed

@Component({
  selector: 'app-ppt-duplicate',
  templateUrl: './ppt-duplicate.component.html',
  styleUrls: ['./ppt-duplicate.component.scss']
})
export class PptDuplicateComponent {
  form: FormGroup;

  pptxFile?: File;
  imageFile?: File;

  uploading = false;
  progress = 0;
  status = '';

  // Build endpoint from environment; falls back to /api/
  private apiUrl = (() => {
    const base = (environment as any)?.apiUrl || '/api/';
    return base.replace(/\/?$/, '/') + 'ppt/duplicate';
  })();

  constructor(private http: HttpClient, fb: FormBuilder) {
    this.form = fb.group({
      slideNumber: [5, [Validators.required, Validators.min(1)]]
    });
  }

  onPickPptx(ev: Event) {
    const f = (ev.target as HTMLInputElement).files;
    this.pptxFile = f && f.length ? f[0] : undefined;
  }

  onPickImage(ev: Event) {
    const f = (ev.target as HTMLInputElement).files;
    this.imageFile = f && f.length ? f[0] : undefined;
  }

  submit() {
    if (!this.pptxFile || !this.imageFile || this.form.invalid) {
      this.status = 'נא לבחור קובץ PPTX ותמונה, ולהזין מספר שקף חוקי.';
      return;
    }

    const fd = new FormData();
    fd.append('pptx', this.pptxFile);
    fd.append('image', this.imageFile);
    fd.append('slideNumber', String(this.form.value.slideNumber ?? 5));

    this.uploading = true;
    this.progress = 0;
    this.status = '';

    this.http.post(this.apiUrl, fd, {
      observe: 'events',
      reportProgress: true,
      responseType: 'blob'
    }).subscribe({
      next: (evt: any) => {
        if (evt.type === HttpEventType.UploadProgress && evt.total) {
          this.progress = Math.round((evt.loaded / evt.total) * 100);
        }
        if (evt.type === HttpEventType.Response) {
          this.saveBlob(evt.body as Blob);
          this.status = 'הקובץ ירד בהצלחה.';
          this.uploading = false;
        }
      },
      error: (err) => {
        this.uploading = false;
        // Try to surface server text if exists
        const msg = (err?.error && typeof err.error === 'string') ? err.error : 'שגיאה בשליחה. בדוק את ה-API, CORS והנתיב.';
        this.status = msg;
      }
    });
  }

  private saveBlob(blob: Blob) {
    const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
    const name = `updated-${ts}.pptx`;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    window.URL.revokeObjectURL(url);
  }
}
