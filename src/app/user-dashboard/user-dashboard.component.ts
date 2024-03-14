import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs'; // Import 'of' to handle cases where you don't need to make an HTTP call
import { interval, switchMap, startWith } from 'rxjs';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router'; // Import the Router
import { environment } from '../../environments/environment';
import { DatePipe } from '@angular/common';

interface Task {
  UserTaskID: number;
  ADUserName: string;
  TaskID: number;
  Status: string; // 'Not Started' | 'In Progress' | 'Completed'
  Progress: number;
  LastUpdated: string; // Assuming this is a date in string format
  dueDate: string; // Assuming this is a date in string format
  // Add other properties that are relevant to your tasks
}

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.scss'],
})
export class UserDashboardComponent implements OnInit {
  loginUserName = '';
  userData: any = {};
  previousOpenCalls: number | null = null;
  importantMessages: any[] = []; // Assuming the data structure is an array of objects

  dateFormat = 'dd/MM/yyyy HH:mm'; // Custom format for date

  columns: string[] = [
    'status',
    'adUserName',
    'taskName',
    'description',
    'creationDate',
    'dueDate',
    'createdBy',
    'timeLeft',

    // 'departure_Date',
  ];

  constructor(private http: HttpClient, private datePipe: DatePipe) {
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
          // Filter the data to only include tasks where adUserName matches loginUserName
          const filteredData = data.filter(
            (task: any) => task.adUserName === this.loginUserName
          );
          this.matTableDataSource.data = filteredData;
        });
      });
    // Fetching important messages
    this.fetchImportantMessages().subscribe((messages) => {
      this.importantMessages = messages;
      console.log(this.importantMessages);
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
      status: 'status',
      adUserName: 'משתמש מטפל ',
      taskName: 'משימה  ',
      description: ' פירוט המשימה ',
      creationDate: ' תאריך יצירה  ',
      dueDate: ' dueDate   ',
      createdBy: 'createdBy ',
    };
    return columnLabels[column] || column;
  }
  fetchImportantMessages(): Observable<any> {
    const url = 'http://localhost:7144/api/importantMessagesAPI';
    return this.http.get(url);
  }
  // Method to format dates
  formatDate(date: string): string | null {
    return this.datePipe.transform(date, 'dd/MM/yyyy HH:mm');
  }
   getTimeLeft(dueDate: string, status: string): string {
    // Check if the task status is not 'Completed'
    if (status !== 'Completed') {
      const dueDateTime = new Date(dueDate).getTime();
      const now = new Date().getTime();
      const timeLeft = dueDateTime - now;
  
      // Convert time left from milliseconds to a more readable format
      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  
      return `${days}d ${hours}h ${minutes}m`;
    } else {
      // Return a message indicating the task is completed
      return "Task is already completed.";
    }
  }
  

  
  // In your Angular component

// Checks if the due date is less than 25 hours away, considering the task's status
isLessThan25Hours(dueDate: string, status: string): boolean {
  const hoursLeft = this.getHoursLeft(dueDate, status);
  return hoursLeft <= 25;
}
// Calculates the hours left until the due date, considering the task's status
getHoursLeft(dueDate: string, status: string): number {
  if (status === 'Completed') {
    // Task is completed, so there are effectively 0 hours left until the due date
    // Or return a specific value that indicates the task is completed, based on your application's needs
    return 0;
  }

  const dueDateTime = new Date(dueDate).getTime();
  const currentTime = new Date().getTime();
  const hoursLeft = (dueDateTime - currentTime) / (1000 * 60 * 60);
  return hoursLeft;
}
// Corrected method to check time left and alert the user accordingly
checkAndAlertUserAboutTimeLeft(task: Task): void {
  const hoursLeft = this.getHoursLeft(task.dueDate,task.Status);
  if (task.Status !== 'Completed') {
    if (hoursLeft <= 1) {
      this.sendAlert('You have less than 1 hour left to complete the task.');
    } else if (hoursLeft <= 12) { // Corrected condition for less than 12 hours
      this.sendAlert('You have less than 12 hours left to complete the task.');
    } else if (hoursLeft <= 25) { // Corrected condition for less than 25 hours
      this.sendAlert('You have less than 25 hours left to complete the task.');
    }
  }
}

// Ensure sendAlert method uses the passed message
sendAlert(message: string): void {
  alert(message); // Use the passed message for the alert
  console.log(message);
}


// Call this method at an appropriate lifecycle hook or after data retrieval
performTimeChecks(): void {
  this.matTableDataSource.data.forEach(task => {
    this.checkAndAlertUserAboutTimeLeft(task);
  });
}

// Then call performTimeChecks periodically, perhaps using setInterval

}
