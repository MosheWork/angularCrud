import { Component, ViewChild, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PermissionsDialogNewComponent } from './permissions-dialog-new/permissions-dialog-new.component'; // Update the path as necessary



//import { AuthService } from '../services/auth.service'; // Your authentication service

export interface Reports {
  rowid: string;
  linkDescription: string;
  linkStatus: string;
  reportName: string;
  linkAdress: string;
  //permissions: string;
}

@Component({
  selector: 'app-reports-permissions',
  templateUrl: './reports-permissions.component.html',
  styleUrls: ['./reports-permissions.component.scss'],
})
export class ReportsPermissionsComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  Title2: string = 'סה"כ תוצאות   ';
  titleUnit: string = 'ניהול הרשאות לדוחות';
  totalResults: number = 0;

  displayedColumns: string[] = [
    'rowid',
    'reportName',
    'linkDescription',
    'linkAdress',
    'btn',
    'permissions'
  ];

  dataSource: MatTableDataSource<Reports> = new MatTableDataSource(); // Initialize dataSource

  // Temporary constant for the current user's role
  currentUserRole: string = '1';
  loginUserName: string = '';

  constructor(private http: HttpClient, private router: Router, public dialog: MatDialog) {}

  ngOnInit(): void {
    const loginUserName = localStorage.getItem('loginUserName');
    console.log('UserAD:' + loginUserName);

    //this.filterReportsDataBasedOnRole();
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.fetchReportsData();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
  fetchReportsData() {
    this.http
      .get<Reports[]>('http://localhost:7144/api/ChameleonOnlineReportsAPI')
      .subscribe(
        (data: Reports[]) => {
          // Map the API response to the new property names
          const mappedData = data.map((report) => ({
            rowid: report.rowid,
            linkDescription: report.linkDescription,
            linkStatus: report.linkStatus,
            reportName: report.reportName,
            linkAdress: report.linkAdress,
          }));
          this.dataSource.data = mappedData;
        },
        (error: any) => {
          console.error('Error fetching reports data:', error);
        }
      );
  }
  navigate(linkAdress: string) {
    this.router.navigate([linkAdress]); // Use the passed link address for navigation
  }
  openPermissionsDialog(report: Reports): void {
    const dialogRef = this.dialog.open(PermissionsDialogNewComponent, {
      width: 'auto', // Set your desired width
      height: 'auto', // Set your desired height
      data: report // Pass the report data to the dialog
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      // Handle dialog close event, e.g., refresh data or display a message
    });
  }

}
