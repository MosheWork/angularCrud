import { Component } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment'

type EncryptResponse = { input: string; encrypted: string | null };
type BatchItem = { input: string; encrypted: string | null };

@Component({
  selector: 'app-id-encrypt',
  templateUrl: './id-encrypt.component.html',
  styleUrls: ['./id-encrypt.component.scss']
})
export class IdEncryptComponent {
  // single
  idNumber = '';
  encrypted: string | null | undefined = undefined;

  // batch (optional textarea UI)
  batchInput = ''; // one id per line
  batchResult: BatchItem[] = [];

  loading = false;
  errorMsg = '';

  opened = false; // (kept if you ever add mat-select etc.)

  constructor(private http: HttpClient) {}



  get apiUrl(): string {
    // environment.apiBaseUrl like "http://localhost:44310/api"
    return `${environment.apiUrl}/IdEncrypt`;
  }

  encryptOne(): void {
    this.resetState(true);
    const id = (this.idNumber || '').trim();
    if (!id) {
      this.fail('יש להזין מספר ת"ז');
      return;
    }

    const params = new HttpParams().set('idNumber', id);
    this.http.get<EncryptResponse>(this.apiUrl, { params })
      .subscribe({
        next: res => {
          this.encrypted = res.encrypted ?? null;
          this.loading = false;
        },
        error: err => this.fail(this.extractError(err))
      });
  }

  encryptBatch(): void {
    this.resetState(true);
    const ids = (this.batchInput || '')
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (ids.length === 0) {
      this.fail('הדבק מזהים (שורה לכל מזהה) לפני שליחה');
      return;
    }

    this.http.post<BatchItem[]>(`${this.apiUrl}/batch`, { ids })
      .subscribe({
        next: res => {
          this.batchResult = res || [];
          this.loading = false;
        },
        error: err => this.fail(this.extractError(err))
      });
  }

  copy(text?: string | null): void {
    if (!text) return;
    navigator.clipboard?.writeText(text).catch(() => {});
  }

  private resetState(spin = false): void {
    this.loading = spin;
    this.errorMsg = '';
    // don’t reset inputs; just results
    this.encrypted = undefined;
    this.batchResult = [];
  }

  private fail(message: string): void {
    this.loading = false;
    this.errorMsg = message || 'שגיאה לא ידועה';
  }

  private extractError(err: any): string {
    // try to surface backend { message, detail }
    if (err?.error?.message) return err.error.message;
    if (typeof err?.error === 'string') return err.error;
    return 'שגיאה בזמן הקריאה לשרת';
  }
}
