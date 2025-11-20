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
    this.buildForm();
    this.setupEmployeeAutocomplete();

    // Prefill in ngOnInit
    if (this.editingRow?.createdFor != null) {
      const normalizedID = String(this.editingRow.createdFor).padStart(9, '0');
      console.log('Prefilling CreatedFor with normalized ID:', normalizedID);

      this.http.get<EmployeeLookupDto[]>(`${this.base}/api/EmployeeLookup/search/?query=${normalizedID}`)
        .subscribe(empArray => {
          const emp = (empArray && empArray.length > 0) ? empArray[0] : null;
          if (!emp) {
            const fallbackEmp: EmployeeLookupDto = { employeeID: normalizedID, fullName: normalizedID };
            this.createdForControl.setValue(fallbackEmp);
            this.form.get('CreatedFor')!.setValue(normalizedID);
            return;
          }

          const sanitizedEmp: EmployeeLookupDto = {
            ...emp,
            fullName: emp.fullName || `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim()
          };
          this.createdForControl.setValue(sanitizedEmp);
          this.form.get('CreatedFor')!.setValue(sanitizedEmp.employeeID);
          console.log('Prefilled CreatedFor:', sanitizedEmp);
        }, err => {
          console.error('Failed to fetch employee info:', err);
          const fallbackEmp: EmployeeLookupDto = { employeeID: normalizedID, fullName: normalizedID };
          this.createdForControl.setValue(fallbackEmp);
          this.form.get('CreatedFor')!.setValue(normalizedID);
        });
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
      CreatedFor: [this.editingRow?.createdFor != null ? String(this.editingRow.createdFor) : null]
    });

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
        const query = typeof value === 'string'
          ? value.trim()
          : `${value?.firstName ?? ''} ${value?.lastName ?? ''}`.trim();

        console.log('Searching employees for query:', query);
        if (!query) return of([]);

        return this.http.get<EmployeeLookupDto[]>(`${this.base}/api/EmployeeLookup/search?query=${encodeURIComponent(query)}`);
      })
    ).subscribe(list => {
      this.filteredEmployees = list || [];
      console.log('Filtered employees updated:', this.filteredEmployees);
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
    console.log('Employee selected from autocomplete:', emp);
    this.createdForControl.setValue(emp);
    this.form.get('CreatedFor')!.setValue(emp.employeeID);
  }

  save(): void {
    if (this.form.invalid) {
      console.warn('Form invalid, save aborted');
      return;
    }

    const payload = new FormData();
    if (this.isEdit && this.editingRow) payload.append('Id', String(this.editingRow.id));

    const createdForValue = this.form.value.CreatedFor;
    const createdForNumber = createdForValue != null ? Number(createdForValue) : null;

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