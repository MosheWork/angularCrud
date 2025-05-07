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
  displayedColumns: string[] = [
    'CaseNumber', 'DepartmentName', 'EnterDepartDate', 'EnterDepartTime',
    'ExitHospTime', 'FirstName', 'LastName', 'Telephone', 'Mobile',
    'BirthDate',  'IsBirthday',
    'CaseManagerStatus', 'CaseManagerCategory', 'CaseManagerUpdate', 'CaseManagerRemarks'
  ];
  dataSource = new MatTableDataSource<any>([]);
  isLoading = true;
  selectedDepartments: string[] = [];
departments: string[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.dataSource.filterPredicate = (data, filter) => {
      const filters = JSON.parse(filter);
      const deptMatch = !filters.departments.length || filters.departments.includes(data.DepartmentName?.trim());
      const textMatch = !filters.text || Object.values(data).some(val =>
        val?.toString().toLowerCase().includes(filters.text)
      );
      return deptMatch && textMatch;
    };
    this.fetchData();
  }

  fetchData(): void {
    this.isLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}ServiceCRM/HospPast72h`).subscribe(data => {
      this.dataSource.data = data.map(item => ({
        ...item,
        EnterDepartDate: item.EnterDepartDate ? new Date(item.EnterDepartDate) : null,
        BirthDate: item.BirthDate ? new Date(item.BirthDate) : null,
        DeathDate: item.DeathDate ? new Date(item.DeathDate) : null,
        CaseManagerUpdate: item.CaseManagerUpdate ? new Date(item.CaseManagerUpdate) : null
      }));

      this.departments = [...new Set(data.map(d => d.DepartmentName).filter(Boolean))].sort();

      this.isLoading = false;

      setTimeout(() => {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      });
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
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
    this.applyFilter(); // reapply filter on department change
  }
  openPhoneCallDialog(row: any) {
    const dialogRef = this.dialog.open(PhoneCallDialogComponent, {
      width: '600px',
      data: row
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Attach the AdmissionNo
        const payload = {
          ...result,
          CaseNumber: row.CaseNumber
        };
  
        this.http.post(`${environment.apiUrl}ServiceCRM/UpdateCaseManagerInfo`, payload).subscribe(
          () => {
            this.fetchData(); // 🔄 Refresh table after successful update
          },
          error => {
            console.error('❌ Failed to update case manager info:', error);
          }
        );
      }
    });
  }
  exportToExcelOnlyWithCaseManagerStatus(): void {
    const rowsWithStatus = this.dataSource.filteredData.filter(
      row => row.CaseManagerStatus && row.CaseManagerStatus.trim() !== ''
    );
  
    if (rowsWithStatus.length === 0) {
      alert('אין שורות עם סטטוס מנהל מקרה לייצוא.');
      return;
    }
  
    const exportData = rowsWithStatus.map(row => ({
      'מספר מקרה': row.CaseNumber,
      'מחלקה': row.DepartmentName,
      'שם פרטי': row.FirstName,
      'שם משפחה': row.LastName,
      'סטטוס מנהל מקרה': row.CaseManagerStatus,
      'קטגוריה': row.CaseManagerCategory,
      'עדכון': row.CaseManagerUpdate ? new Date(row.CaseManagerUpdate).toLocaleDateString() : '',
      'הערות': row.CaseManagerRemarks
    }));
  
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'סטטוס מנהל מקרה' : worksheet },
      SheetNames: ['סטטוס מנהל מקרה']
    };
  
    XLSX.writeFile(workbook, 'CaseManagerStatusOnly.xlsx');
  }
  
  
}
