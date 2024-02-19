import { Component, ViewChild, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

// This is a list of things each report needs to have.
export interface Reports {
  rowid: number; // This is like the report's special number.
  linkDescription: string; // This tells us what the report is about.
  linkStatus: string; // This shows if the report is okay or not.
  reportName: string; // The name of the report.
  linkAdress: string; // Where to find the report.
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
    'Rowid', 'LinkDescription', 'LinkStatus',  'LinkAdress', 'btn',
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
    // First, we ask for permission to see the reports.
    this.http.get<any[]>('http://localhost:7144/api/ChameleonOnlineReportsAPI/allPermissions').subscribe(permissions => {
      // Then, we get all the reports.
      this.http.get<Reports[]>('http://localhost:7144/api/ChameleonOnlineReportsAPI').subscribe(reports => {
        // We only keep the reports we're allowed to see.
        const accessibleReports = reports.filter(report => permissions.some(permission => permission.linkRowId.toUpperCase() === report.linkAdress.toUpperCase()));

        // We make a list of these reports to show on the page.
        const mappedData = accessibleReports.map(report => ({
          rowid: report.rowid,
          linkDescription: report.linkDescription,
          linkStatus: report.linkStatus,
          reportName: report.reportName,
          linkAdress: report.linkAdress,
        }));
        
        this.dataSource.data = mappedData; // We update our list with the reports we can show.
        this.totalResults = mappedData.length; // We count how many reports we have to show.
      });
    });
  }

  // This lets us click on a report to see more about it.
  navigate(linkAdress: string) {
    this.router.navigate([linkAdress]); // We go to the report's page.
  }
}
