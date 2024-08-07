import { Component, ViewChild, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment'

// This is a list of things each report needs to have.
export interface Reports {
  Rowid: number; // This is like the report's special number.
  LinkDescription: string; // This tells us what the report is about.
  LinkStatus: string; // This shows if the report is okay or not.
  ReportName: string; // The name of the report.
  LinkAdress: string; // Where to find the report.
}

// This is the main part of our code where we make everything work!
@Component({
  selector: 'app-main-page-reports', // This is how we find this part of our code.
  templateUrl: './main-page-reports.component.html', // This is the design of our page.
  styleUrls: ['./main-page-reports.component.scss'], // This makes our page look nice.
})
export class MainPageReportsComponent implements OnInit {
  // These lines help us organize our list of reports on the page.
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // These are just titles we see on the page.
  Title2: string = 'סה"כ תוצאות   ';
  titleUnit: string = 'מסך דוחות ';
  totalResults: number = 0; // This keeps track of how many reports we have.

  // This tells us what details to show for each report in our list.
  displayedColumns: string[] = [
    'ReportName',
    'LinkDescription',
    'LinkAdress',
    'btn', //,'Rowid','LinkStatus',
  ];

  // This is where we keep all the reports we want to show on the page.
  dataSource: MatTableDataSource<Reports> = new MatTableDataSource();

  // We'll use this later to check who is using our app.
  loginUserName: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  // This happens when our page starts up.
  ngOnInit(): void {
    // We check who is using our app and remember them.
    this.loginUserName = localStorage.getItem('loginUserName') || '';
    console.log('Logged in user:', this.loginUserName);

    // These lines make sure our list of reports works nicely (like sorting and moving through pages).
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.fetchReportsData(); // We go and get the list of reports.
  }

  // This lets us find specific reports in our list.
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  // This is where we go and get the reports to show on our page.
  fetchReportsData() {
    this.http
      .get<{ UserId: string; LinkRowId: string }[]>(
        environment.apiUrl + 'ChameleonOnlineReportsAPI/allPermissions'
      )
      .subscribe((permissions) => {
        console.log('Fetched permissions:', permissions);

        if (!this.loginUserName) {
          console.error('loginUserName is undefined or empty');
          return; // Exit the function if loginUserName is not set.
        }

        const upperLoginUserName = this.loginUserName.toUpperCase();

        // Transform userId to uppercase in the comparison to ensure case-insensitive matching.
        const userPermissions = permissions.filter(
          (permission) => permission.UserId && permission.UserId.toUpperCase() === upperLoginUserName
        );

        console.log(
          `Filtered userPermissions for ${this.loginUserName}:`,
          userPermissions
        );

        if (userPermissions.length === 0) {
          console.log(`No permissions found for user: ${this.loginUserName}`);
          return; // Exit if no permissions are found for the user.
        }

        this.http
          .get<Reports[]>(environment.apiUrl + 'ChameleonOnlineReportsAPI')
          .subscribe((reports) => {
            console.log('Fetched reports:', reports);

            const accessibleReports = reports.filter((report) =>
              userPermissions.some(
                (permission) =>
                  permission.LinkRowId &&
                  permission.LinkRowId.toUpperCase() === report.LinkAdress.toUpperCase()
              )
            );

            console.log('Accessible reports:', accessibleReports);

            if (accessibleReports.length === 0) {
              console.log(
                `No accessible reports found for user: ${this.loginUserName}`
              );
            } else {
              console.log(
                `Accessible reports found for user: ${this.loginUserName}`,
                accessibleReports
              );
            }

            const mappedData = accessibleReports.map((report) => ({
              Rowid: report.Rowid,
              LinkDescription: report.LinkDescription,
              LinkStatus: report.LinkStatus,
              ReportName: report.ReportName,
              LinkAdress: report.LinkAdress,
            }));

            this.dataSource.data = mappedData;
            this.totalResults = mappedData.length;
            console.log('Mapped data:', mappedData);
          }, error => {
            console.error('Error fetching reports:', error);
          });
      }, error => {
        console.error('Error fetching permissions:', error);
      });
  }

  // This lets us click on a report to see more about it.
  navigate(linkAdress: string) {
    this.router.navigate([linkAdress]); // We go to the report's page.
  }
}
