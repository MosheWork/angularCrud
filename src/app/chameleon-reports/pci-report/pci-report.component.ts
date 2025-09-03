import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import * as XLSX from 'xlsx';
import { environment } from '../../../environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { PCIreportDialogComponent } from '../pci-report-dialog/pci-report-dialog.component';
import { AuthenticationService } from '../../../app/services/authentication-service/authentication-service.component';

@Component({
  selector: 'app-pci-report',
  templateUrl: './pci-report.component.html',
  styleUrls: ['./pci-report.component.scss']
})
export class PCIreportComponent implements OnInit {
  totalResults: number = 0;
  titleUnit: string = 'דו״ח PCI';
  Title1: string = ' סה"כ תוצאות: ';
  Title2: string = '';
  UserName: string = '';
  validCount: number = 0;
  invalidCount: number = 0;
  validPercentage: number = 0;

  // ⬇️ all backend-bound columns changed to lower-first
  displayedColumns: string[] = [
    'caseNumber',
    'drG_Desc_KABALA',
    'drG_DOC_Desc_KABALA',
    'doC_ICD9',
    'drG_Code_Invoice',
    'pcI_Date',
    'hosp_Date',
    'timeCuttingTime',
    'minutesDiff',
    'timeEndSurgery',
    'timeExitingTheOperatingRoom',
    'timeEntranceToTheRecoveryRoom',
    'timeSendPatientBackToDepart',
    'timeExitRecoveryRoom',
    'remark',
    'entryUser',
    'entryDate'
  ];
  

  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  originalData: any[] = [];
  filterForm: FormGroup;
  isLoading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    public dialog: MatDialog,
    private authenticationService: AuthenticationService
  ) {
    this.filterForm = this.fb.group({
      startDate: [null],
      endDate: [null],
      globalFilter: ['']
    });
  }

  ngOnInit() {
    this.authenticationService.getAuthentication().subscribe(
      (response) => {
        const user = response.message.split('\\')[1];
        this.getUserDetailsFromDBByUserName(user.toUpperCase());
      },
      (error) => {
        console.error('❌ Authentication Failed:', error);
      }
    );
    this.fetchData();
  }

  getUserDetailsFromDBByUserName(username: string): void {
    this.http
      .get<any>(`${environment.apiUrl}ServiceCRM/GetEmployeeInfo?username=${username.toUpperCase()}`)
      .subscribe(
        (data) => {
          this.UserName = data.UserName;
        },
        (error) => {
          console.error('Error fetching employee info:', error);
        }
      );
  }

  fetchData() {
    this.isLoading = true;

    const startDate = this.filterForm.value.startDate
      ? new Date(this.filterForm.value.startDate).toISOString().slice(0, 10)
      : null;

    const endDate = this.filterForm.value.endDate
      ? new Date(this.filterForm.value.endDate).toISOString().slice(0, 10)
      : null;

    const params: any = {};
    if (startDate) params.FromDate = startDate; // query params stay as API expects
    if (endDate) params.ToDate = endDate;

    this.http.get<any[]>(`${environment.apiUrl}PCIreport`, { params }).subscribe(
      (data) => {
        // expecting objects with lower-first keys from backend
        this.originalData = data;
        this.applyFilters();
        this.isLoading = false;
      },
      (err) => {
        console.error(err);
        this.isLoading = false;
      }
    );
  }

  applyFilters() {
    const { globalFilter } = this.filterForm.value;

    const filteredData = this.originalData.filter((row) =>
      !globalFilter ||
      Object.values(row).some((value) =>
        value?.toString().toLowerCase().includes(globalFilter.toLowerCase())
      )
    );

    this.dataSource.data = [...filteredData];
    this.totalResults = this.dataSource.data.length;

    // ⬇️ use lower-first field names
    this.validCount = filteredData.filter((row) => row.minutesDiff <= 90).length;
    this.invalidCount = filteredData.filter((row) => row.minutesDiff > 90).length;
    this.validPercentage = this.totalResults > 0 ? Math.round((this.validCount / this.totalResults) * 100) : 0;

    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  resetFilters() {
    this.filterForm.setValue({
      startDate: null,
      endDate: null,
      globalFilter: ''
    });
    this.applyFilters();
  }

  exportToExcel() {
    const filteredData = this.dataSource.filteredData;

    if (filteredData.length === 0) {
      alert('אין נתונים לייצוא!');
      return;
    }

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'PCI Report': worksheet },
      SheetNames: ['PCI Report']
    };
    XLSX.writeFile(workbook, 'PCI_Report.xlsx');
  }

  openRemarkDialog(row: any) {
    this.dialog
      .open(PCIreportDialogComponent, {
        width: '600px',
        data: {
          ...row,
          // ⬇️ keep dialog data consistent with lower-first too
          entryUser: this.UserName
        }
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          console.log('🚩 נשמר בהצלחה — אפשר לרענן אם צריך');
          // this.fetchData();
        }
      });
  }
}
