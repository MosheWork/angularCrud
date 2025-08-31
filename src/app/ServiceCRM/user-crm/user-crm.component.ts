import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PhoneCallDialogComponent } from '../phone-call-dialog/phone-call-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-user-crm',
  templateUrl: './user-crm.component.html',
  styleUrls: ['./user-crm.component.scss']
})
export class UserCRMComponent implements OnInit, AfterViewInit {
  // ✅ all keys are lower-first to match transformed data
  displayedColumns: string[] = [
    'caseNumber', 'departmentName', 'enterDepartDate', 'enterDepartTime',
    'exitHospTime', 'firstName', 'lastName', 'telephone', 'mobile',
    'birthDate', 'isBirthday',
    'caseManagerStatus', 'caseManagerCategory', 'caseManagerUpdate', 'caseManagerRemarks'
  ];

  dataSource = new MatTableDataSource<any>([]);
  isLoading = true;

  selectedDepartments: string[] = [];
  departments: string[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private dialog: MatDialog) {}

  // helper: make first letter of every key lower case
  private lowerFirstKeys<T extends Record<string, any>>(obj: T): any {
    const out: any = {};
    for (const [k, v] of Object.entries(obj || {})) {
      const nk = k.length ? k[0].toLowerCase() + k.slice(1) : k;
      out[nk] = v;
    }
    return out;
  }

  ngOnInit(): void {
    // robust filter that works with our lower-first keys
    this.dataSource.filterPredicate = (data, filter) => {
      let parsed: { text?: string; departments?: string[] } = {};
      try {
        parsed = filter ? JSON.parse(filter) : {};
      } catch {
        parsed = {};
      }

      const text = (parsed.text || '').toLowerCase();
      const departments = parsed.departments || [];

      const deptMatch =
        departments.length === 0 ||
        departments.includes((data.departmentName || '').trim());

      const textMatch =
        !text ||
        Object.values(data).some((val: any) =>
          ((val ?? '') + '').toLowerCase().includes(text)
        );

      return deptMatch && textMatch;
    };

    // safe initial filter
    this.dataSource.filter = JSON.stringify({ text: '', departments: [] });
    this.fetchData();
  }

  fetchData(): void {
    this.isLoading = true;

    this.http.get<any[]>(`${environment.apiUrl}ServiceCRM/HospPast72h`)
      .subscribe(data => {
        // ✅ normalize keys from backend to lower-first, then coerce dates
        const normalized = (data || []).map(item => {
          const it = this.lowerFirstKeys(item);
          return {
            ...it,
            enterDepartDate: it.enterDepartDate ? new Date(it.enterDepartDate) : null,
            birthDate: it.birthDate ? new Date(it.birthDate) : null,
            deathDate: it.deathDate ? new Date(it.deathDate) : null,
            caseManagerUpdate: it.caseManagerUpdate ? new Date(it.caseManagerUpdate) : null
          };
        });

        this.dataSource.data = normalized;

        // build departments list from normalized key
        this.departments = [...new Set(normalized.map(d => d.departmentName).filter(Boolean))].sort();

        this.isLoading = false;

        setTimeout(() => {
          if (this.paginator) this.dataSource.paginator = this.paginator;
          if (this.sort) this.dataSource.sort = this.sort;
        });
      });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.paginator) this.dataSource.paginator = this.paginator;
      if (this.sort) this.dataSource.sort = this.sort;
    });
  }

  applyFilter(event?: Event): void {
    const text = event ? (event.target as HTMLInputElement).value.trim().toLowerCase() : '';
    this.dataSource.filter = JSON.stringify({ text, departments: this.selectedDepartments });
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onDepartmentsChange(): void {
    this.applyFilter();
  }

  openPhoneCallDialog(row: any): void {
    // The dialog template expects PascalCase keys; provide them along with the normalized row
    const dialogData = {
      ...row,
      CaseNumber: row.caseNumber,
      DepartmentName: row.departmentName,
      FirstName: row.firstName,
      LastName: row.lastName,
      Telephone: row.telephone,
      Mobile: row.mobile,
      EnterDepartDate: row.enterDepartDate
    };

    const dialogRef = this.dialog.open(PhoneCallDialogComponent, {
      width: '600px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // backend expects CaseNumber in PascalCase
        const payload = {
          ...result,
          CaseNumber: row.caseNumber
        };

        this.http.post(`${environment.apiUrl}ServiceCRM/UpdateCaseManagerInfo`, payload)
          .subscribe(
            () => this.fetchData(),
            error => console.error('❌ Failed to update case manager info:', error)
          );
      }
    });
  }

  exportToExcelOnlyWithCaseManagerStatus(): void {
    const rowsWithStatus = this.dataSource.filteredData.filter(
      (row: any) => row.caseManagerStatus && row.caseManagerStatus.trim() !== ''
    );

    if (rowsWithStatus.length === 0) {
      alert('אין שורות עם סטטוס מנהל מקרה לייצוא.');
      return;
    }

    const exportData = rowsWithStatus.map((row: any) => ({
      'מספר מקרה': row.caseNumber,
      'מחלקה': row.departmentName,
      'שם פרטי': row.firstName,
      'שם משפחה': row.lastName,
      'סטטוס מנהל מקרה': row.caseManagerStatus,
      'קטגוריה': row.caseManagerCategory,
      'עדכון': row.caseManagerUpdate ? new Date(row.caseManagerUpdate).toLocaleDateString() : '',
      'הערות': row.caseManagerRemarks
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'סטטוס מנהל מקרה': worksheet },
      SheetNames: ['סטטוס מנהל מקרה']
    };

    XLSX.writeFile(workbook, 'CaseManagerStatusOnly.xlsx');
  }
}
