import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, switchMap, startWith } from 'rxjs/operators';
import { of } from 'rxjs';

export interface QueriesDialogData {
  mode: 'add' | 'edit';
  currentUser: string;
  row?: QueriesRow;
}

export interface QueriesRow {
  id: number;
  queryName: string;
  queryText: string;
  description?: string;
  subject?: string;
  subSubject?: string;
  isActive: boolean;
  createdFor?: number;
  createdForFirstName?: string;
  createdForLastName?: string;
  createdBy?: number;
  createdByFirstName?: string;
  createdByLastName?: string;
}

export interface EmployeeLookupDto {
  employeeID: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
}

@Component({
  selector: 'app-QL-dialog',
  templateUrl: './QL-dialog.component.html',
  styleUrls: ['./QL-dialog.component.scss']
})
export class QueriesDialogComponent implements OnInit {

  form!: FormGroup;

  createdForControl = new FormControl<EmployeeLookupDto | null>(null);
  createdByControl = new FormControl<EmployeeLookupDto | null>(null);

  filteredEmployees: EmployeeLookupDto[] = [];
  filteredCreatedFor: EmployeeLookupDto[] = [];
  filteredCreatedBy: EmployeeLookupDto[] = [];

  isEdit = false;
  currentUser = '';
  editingRow?: QueriesRow;

  private base = 'http://localhost:44310';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private dialogRef: MatDialogRef<QueriesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: QueriesDialogData
  ) {
    this.isEdit = data.mode === 'edit';
    this.currentUser = data.currentUser;
    this.editingRow = data.row;
  }

  ngOnInit(): void {
    this.buildForm();
    this.setupAutocomplete(this.createdForControl, list => this.filteredCreatedFor = list);
    this.setupAutocomplete(this.createdByControl, list => this.filteredCreatedBy = list);

    if (this.editingRow?.createdFor != null) {
      this.prefillEmployee(this.editingRow.createdFor, this.createdForControl, 'CreatedFor');
    }

    if (this.editingRow?.createdBy != null) {
      this.prefillEmployee(this.editingRow.createdBy, this.createdByControl, 'CreatedBy');
    }
  }

  private buildForm(): void {
    this.form = this.fb.group({
      QueryName: [this.editingRow?.queryName || '', Validators.required],
      QueryText: [this.editingRow?.queryText || '', Validators.required],
      Description: [this.editingRow?.description || ''],
      Subject: [this.editingRow?.subject || ''],
      SubSubject: [this.editingRow?.subSubject || ''],
      IsActive: [this.editingRow?.isActive ?? true],
      CreatedFor: [this.editingRow?.createdFor != null ? String(this.editingRow.createdFor) : null],
      CreatedBy: [this.editingRow?.createdBy != null ? String(this.editingRow.createdBy) : null]
    });

    this.createdForControl.valueChanges.subscribe(val => {
      if (val && typeof val === 'object') {
        this.form.get('CreatedFor')!.setValue(val.employeeID);
      } else {
        this.form.get('CreatedFor')!.setValue(null);
      }
    });

    this.createdByControl.valueChanges.subscribe(val => {
      if (val && typeof val === 'object') {
        this.form.get('CreatedBy')!.setValue(val.employeeID);
      } else {
        this.form.get('CreatedBy')!.setValue(null);
      }
    });
  }

  private setupAutocomplete(control: FormControl, assign: (list: EmployeeLookupDto[]) => void): void {
    control.valueChanges.pipe(
      startWith(control.value),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((value: any) => {
        const query = typeof value === 'string'
          ? value.trim()
          : `${value?.firstName ?? ''} ${value?.lastName ?? ''}`.trim();

        if (!query) return of([]);

        return this.http.get<EmployeeLookupDto[]>(`${this.base}/api/EmployeeLookup/search?query=${encodeURIComponent(query)}`);
      })
    ).subscribe(list => assign(list || []));
  }

  private prefillEmployee(id: number, control: FormControl, formField: string): void {
    const normalized = String(id).padStart(9, '0');

    this.http.get<EmployeeLookupDto[]>(`${this.base}/api/EmployeeLookup/search/?query=${normalized}`)
      .subscribe(empArray => {
        const emp = (empArray && empArray.length > 0) ? empArray[0] : null;

        if (!emp) {
          const fallback: EmployeeLookupDto = { employeeID: normalized, fullName: normalized };
          control.setValue(fallback);
          this.form.get(formField)!.setValue(normalized);
          return;
        }

        const sanitized: EmployeeLookupDto = {
          ...emp,
          fullName: emp.fullName || `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim()
        };

        control.setValue(sanitized);
        this.form.get(formField)!.setValue(sanitized.employeeID);
      }, _ => {
        const fallback: EmployeeLookupDto = { employeeID: normalized, fullName: normalized };
        control.setValue(fallback);
        this.form.get(formField)!.setValue(normalized);
      });
  }

  displayEmployee(emp: EmployeeLookupDto | null): string {
    if (!emp) return '';
    const full = emp.fullName || `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim();
    return full ? `${full} (${emp.employeeID})` : emp.employeeID;
  }

  compareEmployees(a: EmployeeLookupDto | null, b: EmployeeLookupDto | null): boolean {
    return !!a && !!b && a.employeeID === b.employeeID;
  }

  onSelectEmployee(emp: EmployeeLookupDto): void {
    this.createdForControl.setValue(emp);
    this.form.get('CreatedFor')!.setValue(emp.employeeID);
  }

  onSelectCreatedFor(emp: EmployeeLookupDto): void {
    this.createdForControl.setValue(emp);
    this.form.get('CreatedFor')!.setValue(emp.employeeID);
  }

  onSelectCreatedBy(emp: EmployeeLookupDto): void {
    this.createdByControl.setValue(emp);
    this.form.get('CreatedBy')!.setValue(emp.employeeID);
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    const payload = new FormData();

    if (this.isEdit && this.editingRow) payload.append('Id', String(this.editingRow.id));

    const createdForValue = this.form.value.CreatedFor;
    const createdByValue = this.form.value.CreatedBy;

    payload.append('QueryName', this.form.value.QueryName);
    payload.append('QueryText', this.form.value.QueryText);
    payload.append('Description', this.form.value.Description || '');
    payload.append('Subject', this.form.value.Subject || '');
    payload.append('SubSubject', this.form.value.SubSubject || '');
    payload.append('CreatedFor', createdForValue != null ? String(createdForValue) : '');
    payload.append('CreatedBy', createdByValue != null ? String(createdByValue) : '');
    payload.append('IsActive', this.form.value.IsActive ? '1' : '0');
    payload.append('UpdatedBy', this.currentUser);

    const endpoint = this.isEdit ? 'update' : 'create';

    this.http.post(`${this.base}/api/QueriesList/${endpoint}`, payload)
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: err => console.error('Save failed:', err)
      });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
