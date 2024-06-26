import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs'; // Import 'of' to handle cases where you don't need to make an HTTP call
import { interval, switchMap, startWith } from 'rxjs';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router'; // Import the Router
import { environment } from '../../../environments/environment';
import { DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { EditTaskDialogComponent } from '../edit-task-dialog/edit-task-dialog.component';
import { AddTaskDialogComponentComponent } from '../add-task-dialog-component/add-task-dialog-component.component';

interface Task {
  UserTaskID: number;
  ADUserName: string;
  TaskID: number;
  Status: string; // 'Not Started' | 'In Progress' | 'Completed'
  Progress: number;
  LastUpdated: string; // Assuming this is a date in string format
  dueDate: string; // Assuming this is a date in string format
  //editTodo: string;
}

@Component({
  selector: 'app-tab2',
  templateUrl: './tab2.component.html',
  styleUrls: ['./tab2.component.scss'],
})
export class Tab2Component implements OnInit {
  loginUserName = '';
  userData: any = {};
  taskSummeryData: any = {};
  previousOpenCalls: number | null = null;
  importantMessages: any[] = []; // Assuming the data structure is an array of objects

  dateFormat = 'dd/MM/yyyy HH:mm'; // Custom format for date

  statusMenuOpened = false;
  selectedStatus: string | null = null;
  statusOptions: string[] = ['Not Started', 'In Progress', 'Completed'];

  todoListDisplayedColumns: string[] = [
    'taskName',
    'description',
    'createdBy',
    'creationDate',
    'dueDate',
    'timeLeft',
    'userStatuses',
    'editTodo',
  ];

  displayedColumns: string[] = ['adUserName', 'new', 'inProgress', 'completed'];

  todoListDataSource = new MatTableDataSource<Task>(); // Separate DataSource for TodoList
  dashboardDataSource = new MatTableDataSource<any>(); // Separate DataSource for DashboardData
  TaskSummeryDataSource = new MatTableDataSource<any>(); // Separate DataSource for TodoList

  @ViewChild('dashboardPaginator') dashboardPaginator!: MatPaginator;
  @ViewChild('dashboardSort') dashboardSort!: MatSort;
  @ViewChild('todoListPaginator') todoListPaginator!: MatPaginator;
  @ViewChild('todoListSort') todoListSort!: MatSort;
  @ViewChild('taskSummeryDataPaginator')
  taskSummeryDataPaginator!: MatPaginator;
  @ViewChild('taskSummeryDataSort') taskSummeryDataSort!: MatSort;

  dashboardData: any[] = []; // Assuming the data structure is an array of objects
  dashboardColumns: string[] = [
    'responsibility',
    'open_calls',
    'followUp_calls',
    'waiting_for_user_response',
    'on_hold',
    'closed_today',
    'closed_this_month',
  ];

  constructor(
    private http: HttpClient,
    private datePipe: DatePipe,
    private dialog: MatDialog // Inject MatDialog service
  ) {
    this.matTableDataSource = new MatTableDataSource<any>([]);
  }
  // ViewChild decorators for accessing Angular Material components

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  matTableDataSource: MatTableDataSource<any>; // Define MatTableDataSource

  ngOnInit(): void {
    this.loginUserName = localStorage.getItem('loginUserName') || '';
    interval(60000) // Every 60 seconds
      .pipe(
        startWith(0), // Start immediately upon component initialization
        switchMap(() => this.fetchUserData()) // Switch to this Observable every time it emits
      )
      .subscribe(
        (data) => {
          if (data.length > 0) this.userData = data[0]; // Update userData with the fetched data
          this.checkForNewServiceCall(this.userData.open_calls); // Additional logic
        },
        (error) => {
          console.error('Error fetching user data:', error); // Handle any errors
        }
      );

    // Initialize the filter predicate to filter based on the status text
    this.matTableDataSource.filterPredicate = (
      data: { status: string },
      filter: string
    ) => {
      return data.status.trim().toLowerCase().includes(filter);
    };

    // Fetching important messages
    this.fetchImportantMessages().subscribe((messages) => {
      this.importantMessages = messages;
      console.log(this.importantMessages);
    });

    // Refresh dashboard data every 60 seconds
    interval(60000)
      .pipe(
        startWith(0), // Start immediately
        switchMap(() => this.fetchDashboardData())
      )
      .subscribe((dashboardData) => {
        this.dashboardDataSource.data = dashboardData;
        this.dashboardDataSource.paginator = this.dashboardPaginator;
        this.dashboardDataSource.sort = this.dashboardSort;
      });

    // Refresh todo list data every 60 seconds
    interval(60000)
      .pipe(
        startWith(0), // Start immediately
        switchMap(() => this.fetchTodoListData())
      )
      .subscribe((todoListData) => {
        this.todoListDataSource.data = todoListData;
        this.todoListDataSource.paginator = this.todoListPaginator;
        this.todoListDataSource.sort = this.todoListSort;
      });
    interval(60000)
      .pipe(
        startWith(0), // Start immediately
        switchMap(() => this.fetchTaskSummery())
      )
      .subscribe((taskSummeryData) => {
        this.TaskSummeryDataSource.data = taskSummeryData;
        this.TaskSummeryDataSource.paginator = this.taskSummeryDataPaginator;
        this.TaskSummeryDataSource.sort = this.taskSummeryDataSort;
      });
  }

  fetchUserData(): Observable<any> {
    const url = environment.apiUrl + 'AdminDashboardAPI/GetTotalSysAid';
    return this.http.get<any>(url);
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
      //adUserName: 'משתמש מטפל ',
      taskName: 'משימה  ',
      description: ' פירוט המשימה ',
      creationDate: ' תאריך יצירה  ',
      dueDate: ' dueDate   ',
      createdBy: 'createdBy ',
    };
    return columnLabels[column] || column;
  }

  fetchImportantMessages(): Observable<any> {
    const url = environment.apiUrl + 'importantMessagesAPI';
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
      const hours = Math.floor(
        (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

      return `${days}d ${hours}h ${minutes}m`;
    } else {
      // Return a message indicating the task is completed
      return 'Task is already completed.';
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
    const hoursLeft = this.getHoursLeft(task.dueDate, task.Status);
    if (task.Status !== 'Completed') {
      if (hoursLeft <= 1) {
        this.sendAlert('You have less than 1 hour left to complete the task.');
      } else if (hoursLeft <= 12) {
        // Corrected condition for less than 12 hours
        this.sendAlert(
          'You have less than 12 hours left to complete the task.'
        );
      } else if (hoursLeft <= 24) {
        // Corrected condition for less than 25 hours
        this.sendAlert(
          'You have less than 25 hours left to complete the task.'
        );
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
    this.matTableDataSource.data.forEach((task) => {
      this.checkAndAlertUserAboutTimeLeft(task);
    });
  }

  // Method to handle clicking on the status header
  openStatusMenu() {
    this.statusMenuOpened = !this.statusMenuOpened;
  }

  // Method to apply status filter to the data source
  applyStatusFilter(status: string) {
    if (status) {
      this.matTableDataSource.filter = status.trim().toLowerCase();
    } else {
      this.matTableDataSource.filter = '';
    }
    if (this.matTableDataSource.paginator) {
      this.matTableDataSource.paginator.firstPage();
    }
  }
  openAddTaskDialog(): void {
    this.http
      .get<any[]>(environment.apiUrl + 'AdminDashboardAPI/GetAllUsers')
      .subscribe(
        (users) => {
          const dialogRef = this.dialog.open(AddTaskDialogComponentComponent, {
            width: '650px',
            data: { users: users }, // Passing users to the dialog
          });
          console.log(users);
          dialogRef.afterClosed().subscribe((result) => {
            console.log('The dialog was closed', result);
            // Refresh data if needed
          });
        },
        (error) => {
          console.error('Error fetching users:', error);
        }
      );
  }
  fetchDashboardData(): Observable<any> {
    const url = environment.apiUrl + 'AdminDashboardAPI/GetDashboardData';
    return this.http.get(url);
  }

  fetchTodoListData(): Observable<Task[]> {
    const url = environment.apiUrl + 'AdminDashboardAPI/GetTaskListForAdmin';
    return this.http.get<Task[]>(url);
  }

  fetchTaskSummery(): Observable<any[]> {
    const url = environment.apiUrl + 'AdminDashboardAPI/TaskSummary';
    return this.http.get<any[]>(url); // Return Observable<any[]>
  }
  openEditTaskDialog(task: any): void {
    const dialogRef = this.dialog.open(EditTaskDialogComponent, {
      width: '400px',
      data: { task: task }, // Pass the entire task object to the dialog
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Updated Task:', result);
        // Perform the update operation on your task list or backend
      }
    });
  }
}
