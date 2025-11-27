import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';

// Frontend DTO (kept local for simplicity; remove if you already export this elsewhere)
export interface ServerInventoryDto {
  id?: number | null;
  serverName: string;
  ip?: string | null;
  forSystem?: string | null;
  description?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface EditDialogData {
  id: number | null;  // if null => Add mode, else Edit mode
}

@Component({
  selector: 'app-server-inventory-edit-dialog',
  templateUrl: './server-inventory-edit-dialog.component.html',
  styleUrls: ['./server-inventory-edit-dialog.component.scss']
})
export class ServerInventoryEditDialogComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  isEdit = false;

  private readonly apiBase = `${environment.apiUrl}ServerInventory`;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snack: MatSnackBar,
    private ref: MatDialogRef<ServerInventoryEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditDialogData
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      id: [null],
      serverName: ['', [Validators.required, Validators.maxLength(128), this.trimValidator]],
      ip: ['', [Validators.maxLength(45), this.optionalIpValidator]],
      forSystem: ['', [Validators.maxLength(128), this.trimValidator]],
      description: ['', [Validators.maxLength(400), this.trimValidator]],
    });

    if (this.data?.id) {
      this.isEdit = true;
      this.loadById(this.data.id);
    }
  }

  // ---------------- Validators ----------------
  private trimValidator(ctrl: AbstractControl): ValidationErrors | null {
    const v = (ctrl.value ?? '').toString();
    if (!v) return null;
    return v.trim().length === v.length ? null : { whitespace: true };
  }

  /**
   * Optional IPv4 validator (lenient). Empty is allowed.
   * If you want to allow hostnames too, comment this out or add a hostname regex.
   */
  private optionalIpValidator(ctrl: AbstractControl): ValidationErrors | null {
    const v = (ctrl.value ?? '').toString().trim();
    if (!v) return null; // optional
    const ipv4 =
      /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
    return ipv4.test(v) ? null : { ip: true };
  }
  // --------------------------------------------

  // --------------- Data Load ------------------
  private loadById(id: number): void {
    this.loading = true;
    this.http.get<ServerInventoryDto>(`${this.apiBase}/${id}`).subscribe({
      next: dto => {
        this.form.patchValue({
          id: dto.id ?? null,
          serverName: dto.serverName ?? '',
          ip: dto.ip ?? '',
          forSystem: dto.forSystem ?? '',
          description: dto.description ?? ''
        });
        this.loading = false;
      },
      error: _ => {
        this.loading = false;
        this.snack.open('טעינת נתוני השרת נכשלה', 'סגור', { duration: 3000 });
        this.ref.close(); // close dialog if load failed
      }
    });
  }
  // --------------------------------------------

  // --------------- Save/Close -----------------
  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snack.open('נא למלא שם שרת תקין', 'סגור', { duration: 2000 });
      return;
    }

    const payload: ServerInventoryDto = {
      id: this.form.value.id ?? null,
      serverName: (this.form.value.serverName || '').trim(),
      ip: (this.form.value.ip || '').trim() || null,
      forSystem: (this.form.value.forSystem || '').trim() || null,
      description: (this.form.value.description || '').trim() || null
    };

    this.loading = true;
    this.http.post<ServerInventoryDto>(`${this.apiBase}/upsert`, payload, {
      params: new HttpParams()
    }).subscribe({
      next: _ => {
        this.loading = false;
        this.snack.open(this.isEdit ? 'עודכן בהצלחה' : 'נוסף בהצלחה', 'סגור', { duration: 2000 });
        this.ref.close('saved'); // Parent will refresh list
      },
      error: _ => {
        this.loading = false;
        this.snack.open('שמירה נכשלה', 'סגור', { duration: 3000 });
      }
    });
  }

  close(): void {
    this.ref.close();
  }
  // --------------------------------------------
}
