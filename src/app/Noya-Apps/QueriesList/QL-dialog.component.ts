import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, switchMap, startWith } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

export type QueriesDialogData =
  | { mode: 'add'; currentUser: string }
  | { mode: 'edit'; row: QueriesRow; currentUser: string };

export interface QueriesRow {
  id: number;
  queryName: string;
  queryText: string;
  description?: string;
  subject?: string;
  subSubject?: string;
  isActive: boolean;
  createdForID?: string;
  createdForFirstName?: string;
  createdForLastName?: string;
}

export interface EmployeeLookupDto {
  EmployeeID: string;
  FirstName?: string;
  LastName?: string;
}

@Component({
  selector: 'app-QL-dialog',
  templateUrl: './QL-dialog.component.html',
  styleUrls: ['./QL-dialog.component.scss']
})
export class QueriesDialogComponent implements OnInit {
  form!: FormGroup;

  // FormControl stores object | null
  createdForControl = new FormControl<EmployeeLookupDto | null>(null);
  filteredEmployees: EmployeeLookupDto[] = [];

  currentUser = '';
  isEdit = false;
  editingRow?: QueriesRow;

  private base = 'http://localhost:44310';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    public dialogRef: MatDialogRef<QueriesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: QueriesDialogData
  ) {
    this.isEdit = data.mode === 'edit';
    this.currentUser = data.currentUser;
    if (this.isEdit && 'row' in data) this.editingRow = data.row;
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      QueryName: [this.editingRow?.queryName || '', Validators.required],
      QueryText: [this.editingRow?.queryText || '', Validators.required],
      Description: [this.editingRow?.description || ''],
      Subject: [this.editingRow?.subject || ''],
      SubSubject: [this.editingRow?.subSubject || ''],
      IsActive: [this.editingRow?.isActive ?? true],
      CreatedFor: [this.editingRow?.createdForID || '', Validators.required]
    });

    this.setupEmployeeAutocomplete();

    // Pre-fill input on edit
    if (this.editingRow?.createdForID) {
      this.createdForControl.setValue({
        EmployeeID: this.editingRow.createdForID,
        FirstName: this.editingRow.createdForFirstName || '',
        LastName: this.editingRow.createdForLastName || ''
      });
    }
  }

  private setupEmployeeAutocomplete() {
    this.createdForControl.valueChanges.pipe(
      startWith(this.createdForControl.value),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((value: EmployeeLookupDto | string | null) => {
        let query = '';
        if (!value) return of([]);
        if (typeof value === 'string') query = value.trim();
        else query = [value.FirstName, value.LastName].filter(Boolean).join(' ').trim();
        if (!query) return of([]);
        return this.http.get<EmployeeLookupDto[]>(`${this.base}/api/EmployeeLookup/search?query=${encodeURIComponent(query)}`);
      })
    ).subscribe(employees => this.filteredEmployees = employees || []);
  }

  displayEmployee(emp: EmployeeLookupDto | null): string {
    if (!emp) return '';
    const nameParts = [emp.FirstName, emp.LastName].filter(Boolean);
    return nameParts.length ? `${nameParts.join(' ')} (${emp.EmployeeID})` : `(${emp.EmployeeID})`;
  }

  onSelectEmployee(employee: EmployeeLookupDto) {
    // Set input to object
    this.createdForControl.setValue(employee, { emitEvent: false });
    // Save EmployeeID in form
    this.form.get('CreatedFor')!.setValue(employee.EmployeeID);
  }

  save(): void {
    if (this.form.invalid) return;

    const payload = new FormData();
    if (this.isEdit && this.editingRow) payload.append('Id', String(this.editingRow.id));

    payload.append('QueryName', this.form.value.QueryName || '');
    payload.append('QueryText', this.form.value.QueryText || '');
    payload.append('Description', this.form.value.Description || '');
    payload.append('Subject', this.form.value.Subject || '');
    payload.append('SubSubject', this.form.value.SubSubject || '');
    payload.append('CreatedFor', this.form.value.CreatedFor || '');
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
