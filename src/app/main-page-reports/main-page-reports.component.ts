import { Component, ViewChild, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';

//import { AuthService } from '../services/auth.service'; // Your authentication service

export interface Reports {
  reportID: string;
  reportName: string;
  departmentName: string;
  info: string;
  linkToPage: string;
  permissions: string;
}
@Component({
  selector: 'app-main-page-reports',
  templateUrl: './main-page-reports.component.html',
  styleUrls: ['./main-page-reports.component.scss'],
})
export class MainPageReportsComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  Title2: string = 'סה"כ תוצאות   ';
  titleUnit: string = 'מסך דוחות ';
  totalResults: number = 0;

  displayedColumns: string[] = [ 'reportName', 'departmentName',
  'info', 'btn'];

  dataSource: MatTableDataSource<Reports> = new MatTableDataSource(); // Initialize dataSource

  // Temporary constant for the current user's role
  currentUserRole: string = '1';
  loginUserName: string = '';

  // Original reports data
  // reportsData: Reports[] = [
  //   {
  //     Dept: 'מערכות מידע',
  //     reportName: ' רשימת קריאות',
  //     summry: 'רשימת כל הקריאות ממוקד אחוד',
  //     link: '/SysAid',
  //   },
  //   {
  //     Dept: 'הנדסה רפואית',
  //     reportName: 'רשימת מכשירים',
  //     summry: 'רשימת מכשירים בקמיליון',
  //     link: '/medicalDevices',
  //   },
  //   // ... more reports ...
  // ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const loginUserName = localStorage.getItem('loginUserName');
    console.log('UserAD:' + loginUserName);

    //this.filterReportsDataBasedOnRole();
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.fetchReportsData();
  }
  // filterReportsDataBasedOnRole() {
  //   let filteredData = this.reportsData;

  //   switch (this.currentUserRole) {
  //     case '1':
  //       // Filtering logic for role 1
  //       filteredData = this.reportsData.filter(
  //         (report) => report.Dept === 'מערכות מידע'
  //       );
  //       break;
  //     case '2':
  //       // Filtering logic for role 1
  //       filteredData = this.reportsData.filter(
  //         (report) => report.Dept === 'הנדסה רפואית'
  //       );
  //       break;
  //     case 'Admin':
  //       // Filtering logic for admin (show all reports)
  //       // You can adjust this logic based on your requirements
  //       break;

  //     // Add more cases for other roles as needed
  //     // case 'roleX':
  //     //   // Filtering logic for role X
  //     //   break;

  //     default:
  //       // If there is no matching role, show nothing
  //       filteredData = [];
  //       break;
  //   }

  //   this.dataSource = new MatTableDataSource(filteredData);
  //   this.totalResults = filteredData.length;
  // }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
  fetchReportsData() {
    this.http.get<Reports[]>('http://localhost:7144/api/ChameleonOnlineReportsAPI').subscribe(
      (data: Reports[]) => {
        // Map the API response to the new property names
        const mappedData = data.map(report => ({
          reportID: report.reportID,
          reportName: report.reportName,
          departmentName: report.departmentName,
          info: report.info,
          linkToPage: report.linkToPage,
          permissions: report.permissions
        }));
        this.dataSource.data = mappedData;
      },
      (error: any) => {
        console.error('Error fetching reports data:', error);
      }
    );
  }
}
