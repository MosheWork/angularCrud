import { Component, OnInit, ViewChild,AfterViewInit,ElementRef   } from '@angular/core';
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
import { MatDialog } from '@angular/material/dialog';
import { AddTaskDialogComponentComponent } from './add-task-dialog-component/add-task-dialog-component.component';
import { ChartOptions, ChartType, ChartData, Chart,registerables  } from 'chart.js';
import { MatTabChangeEvent } from '@angular/material/tabs';





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
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit,AfterViewInit  {
 
  boardId: string = '';

  activeTabIndex: number = 0; // Default to the first tab

  private yearlyChartInstance?: Chart;
  private dailyChartInstance?: Chart;
  private monthlyChartInstance?: Chart;
  
  loginUserName = '';
  userData: any = {};
  taskSummeryData: any = {};
  previousOpenCalls: number | null = null;
  importantMessages: any[] = []; // Assuming the data structure is an array of objects

  dateFormat = 'dd/MM/yyyy HH:mm'; // Custom format for date

  statusMenuOpened = false;
  selectedStatus: string | null = null;
  statusOptions: string[] = ['Not Started', 'In Progress', 'Completed'];

  public barChartOptions: ChartOptions = {
    responsive: true,
  };
  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'קריאות - שנתי',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };
  public dailyChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      data: [],
      label: 'קריאות - יומי',
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 1,
    }]
  };

  public monthlyChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      data: [],
      label: 'קריאות - חודשי',
      backgroundColor: 'rgba(255, 206, 86, 0.2)',
      borderColor: 'rgba(255, 206, 86, 1)',
      borderWidth: 1,
    }]
  };
  columns: string[] = [
    //'taskID',
    'taskName',
    'description',
    'createdBy',
    'creationDate',
    'dueDate',
    'timeLeft',
    'userStatuses',
    //'adUserName',
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
  @ViewChild('yearlyChartCanvas') yearlyChartCanvas!: ElementRef<HTMLCanvasElement>;
@ViewChild('dailyChartCanvas') dailyChartCanvas!: ElementRef<HTMLCanvasElement>;
@ViewChild('monthlyChartCanvas') monthlyChartCanvas!: ElementRef<HTMLCanvasElement>;


  dashboardData: any[] = []; // Assuming the data structure is an array of objects
  dashboardColumns: string[] = [
    'fullName',
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
    document.title = 'מערכת ניהול';
    this.loginUserName = localStorage.getItem('loginUserName') || '';
  
    // Fetch and initialize user data
    interval(60000)
      .pipe(
        startWith(0),
        switchMap(() => this.fetchUserData())
      )
      .subscribe(
        (data) => {
          if (data.length > 0) this.userData = data[0];
          this.checkForNewServiceCall(this.userData.open_calls);
        },
        (error) => {
          console.error('Error fetching user data:', error);
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
      console.log('Important Messages:', this.importantMessages);
    });
  
    // Fetch dashboard data and initialize moveDescription from local storage using fullName as the unique identifier
    this.fetchDashboardData().subscribe((dashboardData: any[]) => {
      console.log('Fetched Dashboard Data:', dashboardData);
      this.dashboardDataSource.data = dashboardData.map((element: any) => {
        const savedStatus = localStorage.getItem(`moveDescription-${element.fullName}`);
        if (savedStatus) {
          console.log(`Initializing moveDescription for ${element.fullName}: ${savedStatus}`);
          element.moveDescription = savedStatus;
        }
        return element;
      });
      this.dashboardDataSource.paginator = this.dashboardPaginator;
      this.dashboardDataSource.sort = this.dashboardSort;
    });
  
    // Refresh dashboard data every 60 seconds
    interval(60000)
      .pipe(
        startWith(0),
        switchMap(() => this.fetchDashboardData())
      )
      .subscribe((dashboardData: any[]) => {
        console.log('Refreshed Dashboard Data:', dashboardData);
        this.dashboardDataSource.data = dashboardData.map((element: any) => {
          const savedStatus = localStorage.getItem(`moveDescription-${element.fullName}`);
          if (savedStatus) {
            console.log(`Initializing moveDescription for ${element.fullName}: ${savedStatus}`);
            element.moveDescription = savedStatus;
          }
          return element;
        });
        this.dashboardDataSource.paginator = this.dashboardPaginator;
        this.dashboardDataSource.sort = this.dashboardSort;
      });
  
    // Refresh todo list data every 60 seconds
    interval(60000)
      .pipe(
        startWith(0),
        switchMap(() => this.fetchTodoListData())
      )
      .subscribe((todoListData) => {
        this.todoListDataSource.data = todoListData;
        this.todoListDataSource.paginator = this.todoListPaginator;
        this.todoListDataSource.sort = this.todoListSort;
      });
  
    // Refresh task summary data every 60 seconds
    interval(60000)
      .pipe(
        startWith(0),
        switchMap(() => this.fetchTaskSummery())
      )
      .subscribe((taskSummeryData) => {
        this.TaskSummeryDataSource.data = taskSummeryData;
        this.TaskSummeryDataSource.paginator = this.taskSummeryDataPaginator;
        this.TaskSummeryDataSource.sort = this.taskSummeryDataSort;
      });
  }
  
  
  
  
  
  ngAfterViewInit(): void {
    Chart.register(...registerables); 
    this.initializeDailyChart();
    this.initializeMonthlyChart();
    this.initializeYearlyChart();
  

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


  private fetchSysAidData(apiEndpoint: string, chartData: ChartData<'bar'>, chartCanvas: ElementRef<HTMLCanvasElement>, callback: (newChart: Chart) => void): void {
    this.http.get<any[]>(`${environment.apiUrl}${apiEndpoint}`).subscribe({
      next: (response) => {
        chartData.labels = response.map(item => item.problem_sub_type);
        chartData.datasets[0].data = response.map(item => item.count);
  
        const context = chartCanvas.nativeElement.getContext('2d');
        if (context !== null) {
          const newChart = new Chart(context, {
            type: this.barChartType,
            data: chartData,
            options: this.barChartOptions,
          });
          callback(newChart);
        } else {
          console.error('Failed to get canvas context');
        }
      },
      error: (error) => console.error(`Error fetching SysAid data from ${apiEndpoint}:`, error),
    });
  }
  
  

  // private initializeChart(): void {
  //   new Chart('myChart', {
  //     type: this.barChartType,
  //     data: this.barChartData,
  //     options: this.barChartOptions,
  //   });
  // }

  private initializeYearlyChart(): void {
    if (this.yearlyChartCanvas) {
      if (this.yearlyChartInstance) {
        this.yearlyChartInstance.destroy();
      }
      this.fetchSysAidData('GetSysAidDataGraphYear', this.barChartData, this.yearlyChartCanvas, (newChart) => {
        this.yearlyChartInstance = newChart;
      });
    }
  }
  
  private initializeDailyChart(): void {
    if (this.dailyChartCanvas) {
      if (this.dailyChartInstance) {
        this.dailyChartInstance.destroy();
      }
      this.fetchSysAidData('GetSysAidDataGraphDay', this.dailyChartData, this.dailyChartCanvas, (newChart) => {
        this.dailyChartInstance = newChart;
      });
    }
  }
  
  private initializeMonthlyChart(): void {
    if (this.monthlyChartCanvas) {
      if (this.monthlyChartInstance) {
        this.monthlyChartInstance.destroy();
      }
      this.fetchSysAidData('GetSysAidDataGraphMonth', this.monthlyChartData, this.monthlyChartCanvas, (newChart) => {
        this.monthlyChartInstance = newChart;
      });
    }
  }
  

  onTabChanged(event: MatTabChangeEvent): void {
    // Use a slight delay to ensure the canvas elements are available if needed
    setTimeout(() => {
      switch (event.index) {
        case 0: // Yearly tab index
          this.initializeYearlyChart();
          break;
        case 1: // Daily tab index
          this.initializeDailyChart();
          break;
        case 2: // Monthly tab index
          this.initializeMonthlyChart();
          break;
        default:
          console.error('Unknown tab index:', event.index);
          break;
      }
    });
  }
  
  toggleMoveDescription(element: any) {
    element.moveDescription = element.moveDescription === 'Online' ? 'Offline' : 'Online';
    console.log(`Toggling moveDescription for ${element.fullName}: ${element.moveDescription}`);
    localStorage.setItem(`moveDescription-${element.fullName}`, element.moveDescription);
  }
  
  
  
  
}
