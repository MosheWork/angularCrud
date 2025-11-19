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
  createdFor?: number;              // EmployeeID stored as number
  createdForFirstName?: string;
  createdForLastName?: string;
}

export interface EmployeeLookupDto {
  employeeID: string;   // lowercase as returned by API
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
  filteredEmployees: EmployeeLookupDto[] = [];

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
    console.log('Initializing QueriesDialogComponent...');
    this.buildForm();
    this.setupEmployeeAutocomplete();

    // Prefill employee selection if editing
    if (this.editingRow?.createdFor != null && this.editingRow.createdFor > 0) {
      console.log('Prefilling CreatedFor with ID:', this.editingRow.createdFor);

      const emp: EmployeeLookupDto = {
        employeeID: String(this.editingRow.createdFor),
        firstName: this.editingRow.createdForFirstName || '',
        lastName: this.editingRow.createdForLastName || '',
        fullName: `${this.editingRow.createdForFirstName || ''} ${this.editingRow.createdForLastName || ''}`.trim()
      };

      console.log('Prefilled employee object:', emp);

      this.createdForControl.setValue(emp);
      this.form.get('CreatedFor')!.setValue(emp.employeeID);
      console.log('CreatedFor control set to:', this.createdForControl.value);
      console.log('Form CreatedFor value set to:', this.form.value.CreatedFor);
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
      CreatedFor: [this.editingRow?.createdFor != null ? String(this.editingRow.createdFor) : null, Validators.required]
    });

    // Sync hidden form field whenever autocomplete selection changes
    this.createdForControl.valueChanges.subscribe(val => {
      if (val && typeof val === 'object') {
        console.log('Autocomplete selection changed:', val);
        this.form.get('CreatedFor')!.setValue(val.employeeID);
      } else {
        console.log('Autocomplete cleared');
        this.form.get('CreatedFor')!.setValue(null);
      }
      console.log('Form CreatedFor value now:', this.form.value.CreatedFor);
    });
  }

  private setupEmployeeAutocomplete(): void {
    this.createdForControl.valueChanges.pipe(
      startWith(this.createdForControl.value),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((value: any) => {
        const query =
          typeof value === 'string'
            ? value.trim()
            : `${value?.firstName ?? ''} ${value?.lastName ?? ''}`.trim();

        console.log('Searching employees for query:', query);

        if (!query) return of([]);

        return this.http.get<EmployeeLookupDto[]>(
          `${this.base}/api/EmployeeLookup/search?query=${encodeURIComponent(query)}`
        );
      })
    ).subscribe(list => {
      this.filteredEmployees = list || [];
      console.log('Filtered employees updated:', this.filteredEmployees);
    });
  }

  displayEmployee(emp: EmployeeLookupDto | null): string {
    if (!emp) return '';
    const full = emp.fullName || `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim();
    return `${full} (${emp.employeeID})`;
  }

  compareEmployees(a: EmployeeLookupDto | null, b: EmployeeLookupDto | null): boolean {
    return !!a && !!b && a.employeeID === b.employeeID;
  }

  onSelectEmployee(emp: EmployeeLookupDto): void {
    console.log('Employee selected from autocomplete:', emp);
    this.createdForControl.setValue(emp);
    this.form.get('CreatedFor')!.setValue(emp.employeeID);
    console.log('Form CreatedFor after selection:', this.form.value.CreatedFor);
  }

  save(): void {
    console.log('Attempting to save form...');
    console.log('Form before save:', this.form.value);

    if (this.form.invalid) {
      console.warn('Form invalid, save aborted');
      return;
    }

    const payload = new FormData();

    if (this.isEdit && this.editingRow) {
      payload.append('Id', String(this.editingRow.id));
    }

    // Convert CreatedFor to number
    const createdForValue = this.form.value.CreatedFor;
    const createdForNumber = createdForValue != null ? Number(createdForValue) : null;
    console.log('CreatedFor converted to number:', createdForNumber);

    payload.append('QueryName', this.form.value.QueryName);
    payload.append('QueryText', this.form.value.QueryText);
    payload.append('Description', this.form.value.Description || '');
    payload.append('Subject', this.form.value.Subject || '');
    payload.append('SubSubject', this.form.value.SubSubject || '');
    payload.append('CreatedFor', createdForNumber != null ? String(createdForNumber) : '');
    payload.append('IsActive', this.form.value.IsActive ? '1' : '0');
    payload.append('UpdatedBy', this.currentUser);

    const endpoint = this.isEdit ? 'update' : 'create';
    console.log('POSTing payload to:', `${this.base}/api/QueriesList/${endpoint}`);
    // Build an array of form-data entries since FormData.entries() may not be available in this TS lib
    const payloadEntries: [string, any][] = [];
    payload.forEach((value, key) => payloadEntries.push([key, value]));
    console.log('Payload:', payloadEntries);

    this.http.post(`${this.base}/api/QueriesList/${endpoint}`, payload)
      .subscribe({
        next: () => {
          console.log('Save successful');
          this.dialogRef.close(true);
        },
        error: err => console.error('Save failed:', err)
      });
  }

  cancel(): void {
    console.log('Dialog cancelled');
    this.dialogRef.close(false);
  }
}
