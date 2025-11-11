import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';

export type QueriesDialogData =
  | { mode: 'add'; currentUser: string }
  | { mode: 'edit'; row: any; currentUser: string };

@Component({
  selector: 'app-QL-dialog',
  templateUrl: './QL-dialog.component.html',
  styleUrls: ['./QL-dialog.component.scss']
})
export class QueriesDialogComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  currentUser = '';
  editingRow: any = null;

  base = 'http://localhost:44310'; // API base

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    public dialogRef: MatDialogRef<QueriesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: QueriesDialogData
  ) {
    this.isEdit = data.mode === 'edit';
    this.currentUser = data.currentUser;

    if (this.isEdit && 'row' in data) {
      this.editingRow = data.row;
    }
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      QueryName: [this.editingRow?.queryName ?? '', Validators.required],
      QueryText: [this.editingRow?.queryText ?? '', Validators.required],
      Description: [this.editingRow?.description ?? ''],
      Subject: [this.editingRow?.subject ?? ''],
      SubSubject: [this.editingRow?.subSubject ?? ''],
      IsActive: [this.editingRow?.isActive ?? true]
    });
  }

  save(): void {
    if (this.form.invalid) return;

    const payload = new FormData();
    if (this.isEdit) {
      payload.append('Id', String(this.editingRow.id));
    }

    payload.append('QueryName', this.form.value.QueryName ?? '');
    payload.append('QueryText', this.form.value.QueryText ?? '');
    payload.append('Description', this.form.value.Description ?? '');
    payload.append('Subject', this.form.value.Subject ?? '');
    payload.append('SubSubject', this.form.value.SubSubject ?? '');
    payload.append('CreatedFor', this.form.value.CreatedFor ?? '');
    payload.append('IsActive', this.form.value.IsActive ? '1' : '0');
    payload.append('UpdatedBy', this.currentUser);

    const endpoint = this.isEdit ? 'update' : 'create';

    this.http.post(`${this.base}/api/QueriesList/${endpoint}`, payload)
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: err => console.error('Save failed', err)
      });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
