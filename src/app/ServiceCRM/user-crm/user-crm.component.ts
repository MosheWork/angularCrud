import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PhoneCallDialogComponent } from '../phone-call-dialog/phone-call-dialog.component';
import { MatDialog } from '@angular/material/dialog';


@Component({
  selector: 'app-user-crm',
  templateUrl: './user-crm.component.html',
  styleUrls: ['./user-crm.component.scss']
})
export class UserCRMComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'AdmissionNo', 'UnitName', 'AdmissionDate', 'FirstName', 'LastName',
    'Phone', 'PhoneCell', 'AgeFormatted', 'BirthDateFormatted',
    'IsBirthdayToday', 'CallStatus', 'Catagory', 'FreeText', 'BirthDayToggle'
  ];
  summary: any;
  summaryWithCaseManager: any;
  dataSource = new MatTableDataSource<any>([]);
  isLoading: boolean = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.fetchData();
    this.fetchSummaries();

  }

  fetchSummaries(): void {
    this.http.get<any>(`${environment.apiUrl}ServiceCRM/summary`).subscribe(data => {
      this.summary = data;
    });

    this.http.get<any>(`${environment.apiUrl}ServiceCRM/summaryWithCaseManager`).subscribe(data => {
      this.summaryWithCaseManager = data;
    });
  }

  fetchData(): void {
    this.isLoading = true;
  
    this.http.get<any[]>(`${environment.apiUrl}ServiceCRM/CurrentPatients`).subscribe(data => {
      this.dataSource.data = data.map(item => ({
        ...item,
        AdmissionDate: item.AdmissionDate ? new Date(item.AdmissionDate) : null
      }));
  
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
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openPhoneCallDialog(row: any) {
    const dialogRef = this.dialog.open(PhoneCallDialogComponent, {
      width: '600px',
      data: row
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        row.CaseManagerStatus = result.caseManagerStatus;
        row.CaseManagerCategory = result.caseManagerCategory;
        row.CaseManagerUpdate = result.caseManagerUpdate;
        row.CaseManagerRemarks = result.caseManagerRemarks;
        // You can also call an API to update this on the backend
      }
    });
  }
}
