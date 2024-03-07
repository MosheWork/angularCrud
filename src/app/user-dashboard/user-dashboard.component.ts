import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs'; // Import 'of' to handle cases where you don't need to make an HTTP call
import { interval, switchMap, startWith } from 'rxjs';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router'; // Import the Router
import { environment } from '../../environments/environment'

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.scss'],
})
export class UserDashboardComponent implements OnInit {
  loginUserName = '';
  userData: any = {};
  previousOpenCalls: number | null = null;

  columns: string[] = [
    'id',
    'usersAssigned',
    'title',
    'description',
    'dateCreated',
    'dateClosed',
    'status',

    // 'departure_Date',
  ];

  constructor(private http: HttpClient) {
    this.matTableDataSource = new MatTableDataSource<any>([]);
  }
  // ViewChild decorators for accessing Angular Material components

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  matTableDataSource: MatTableDataSource<any>; // Define MatTableDataSource

  ngOnInit(): void {
    this.loginUserName = localStorage.getItem('loginUserName') || '';
    interval(60000) // 60000 milliseconds = 1 minute
      .pipe(
        startWith(0),
        switchMap(() => this.fetchUserData(this.loginUserName)) // Adjusted to pass loginUserName
      )
      .subscribe((data) => {
        // This assumes your backend returns the data in the format you expect for userData
        this.userData = data;
        this.checkForNewServiceCall(this.userData.open_calls);

        this.fetchTodoListData().subscribe((data) => {
          // Assuming 'data' is the array of todos you want to display
          this.matTableDataSource.data = data;
        });
      });
  }

  fetchUserData(userName: string): Observable<any> {
    if (!userName) {
      return of({}); // Return an empty object wrapped in an Observable if userName is falsy
    }
    const url = environment.apiUrl + 'UsersDashboardAPI/' + userName;
    return this.http.get(url); // Directly return the Observable from the HTTP GET request
  }
  fetchTodoListData(): Observable<any> {
    const url = environment.apiUrl + 'UsersDashboardAPI/TodoList';
    return this.http.get(url);
  }

  checkForNewServiceCall(openCalls: string) {
    const currentOpenCalls = parseInt(openCalls, 10);
    if (
      this.previousOpenCalls !== null &&
      currentOpenCalls > this.previousOpenCalls
    ) {
      alert('New service call received!');
    }
    this.previousOpenCalls = currentOpenCalls;
  }
  // Method to get display-friendly column labels

  getColumnLabel(column: string): string {
    const columnLabels: Record<string, string> = {
      id: 'id',
      usersAssigned: 'משתמש מטפל ',
      title: 'משימה  ',
      description: ' פירוט המשימה ',
      dateCreated: ' תאריך יצירה  ',
      dateClosed: ' תאריך סגירה  ',
      status: 'סטטוס ',
    };
    return columnLabels[column] || column;
  }
}
