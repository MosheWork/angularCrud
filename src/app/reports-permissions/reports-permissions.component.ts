import { Component, ViewChild, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PermissionsDialogNewComponent } from './permissions-dialog-new/permissions-dialog-new.component'; // Update the path as necessary
import { AddReportComponent } from './add-report/add-report.component';
import { UpdateReportComponent } from './update-report/update-report.component';
import { environment } from '../../environments/environment'

export interface Reports {
  Rowid: string;
  LinkDescription: string;
  LinkStatus: string;
  ReportName: string;
  LinkAdress: string;
  //permissions: string;
}
export interface Users {
  aDUserName: string;
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
    'Rowid',
    'ReportName',
    'LinkDescription',
    'LinkAdress',
    'btn',
    'permissions',
    'edit',
  ];

  dataSource: MatTableDataSource<Reports> = new MatTableDataSource(); // Initialize dataSource
  // Temporary constant for the current user's role
  currentUserRole: string = '1';
  loginUserName: string = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    public dialog: MatDialog
  ) {}

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
      .get<Reports[]>(environment.apiUrl + 'ChameleonOnlineReportsAPI/AllReports')
      .subscribe(
        (data: Reports[]) => {
          // Map the API response to the new property names
          const mappedData = data.map((report) => ({
            Rowid: report.Rowid,
            LinkDescription: report.LinkDescription,
            LinkStatus: report.LinkStatus,
            ReportName: report.ReportName,
            LinkAdress: report.LinkAdress,
          }));
          this.dataSource.data = mappedData;
        },
        (error: any) => {
          console.error('Error fetching reports data:', error);
        }
      );
  }

  navigate(LinkAdress: string) {
    this.router.navigate([LinkAdress]); // Use the passed link address for navigation
  }

  openPermissionsDialog(LinkAdress: string): void {
    this.http.get<Users[]>(environment.apiUrl + 'Users').subscribe(
      (users: Users[]) => {
        const dialogRef = this.dialog.open(PermissionsDialogNewComponent, {
          width: '800px', // Set your desired width
          height: 'auto', // Set your desired height
          data: { users: users, LinkAdress: LinkAdress }, // Pass both users and LinkAdress to the dialog
        });

        dialogRef.afterClosed().subscribe((result) => {
          console.log('The dialog was closed');
          // Handle dialog close event, e.g., refresh data or display a message
        });
      },
      (error: any) => {
        console.error('Error fetching users data:', error);
      }
    );
  }

  openAddNewDialog(): void {
    const dialogRef = this.dialog.open(AddReportComponent, {
      width: '800px',
      height: 'auto',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // The dialog was closed after a successful POST request
        this.fetchReportsData(); // Refresh the table data
      }
    });
  }

  openUpdateDialog(report: Reports): void {
    const dialogRef = this.dialog.open(UpdateReportComponent, {
      width: '800px',
      height: 'auto',
      data: report, // Pass the selected report's data to the dialog
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // If the dialog was closed with updated report data, refresh the reports list
        this.fetchReportsData();
      }
    });
  }
  goToHome() {
    this.router.navigate(['/MainPageReports']); // replace '/home' with your desired route
  }
}
