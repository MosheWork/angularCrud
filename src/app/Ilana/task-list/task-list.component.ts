import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AddTaskComponent } from '../add-task/add-task.component';
import { EditTaskComponent } from '../edit-task/edit-task.component';

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent implements OnInit {
  displayedColumns: string[] = [];  // For dynamic columns
  staticColumns: string[] = ['EmployeeID', 'EmployeeSektorID'];  // Add 'EmployeeSektorID' as a static column
  tasksByEmployee: any = {};  // Store tasks grouped by EmployeeID
  sektorIDs: string[] = [];
  selectedSektorID: string = '';  // Optional if you want to select a specific sector

  constructor(private http: HttpClient, public dialog: MatDialog) { }

  ngOnInit(): void {
    this.loadSektorIDs();
    this.loadTasks();  // Load tasks on initialization without filtering by sector
  }

  loadSektorIDs(): void {
    this.http.get<string[]>(environment.apiUrl + 'IlanaTaskManager/groupedSektorIDs').subscribe(data => {
      this.sektorIDs = data;
    });
  }

  loadTasks(): void {
    this.http.get<any[]>(environment.apiUrl + `IlanaTaskManager/recordsBySektor`).subscribe(data => {
      this.processTaskData(data);
    });
  }

  processTaskData(tasks: any[]): void {
    // Reset dynamic columns and tasks
    this.displayedColumns = [];
    this.tasksByEmployee = {};

    // Process tasks
    tasks.forEach(task => {
      if (!this.tasksByEmployee[task.EmployeeID]) {
        this.tasksByEmployee[task.EmployeeID] = { EmployeeSektorID: task.EmployeeSektorID };
      }
      this.tasksByEmployee[task.EmployeeID][task.TaskDesc] = task;

      if (!this.displayedColumns.includes(task.TaskDesc)) {
        this.displayedColumns.push(task.TaskDesc);
      }
    });

    // Include static columns at the beginning
    this.displayedColumns = this.staticColumns.concat(this.displayedColumns);
  }

  getEmployeeIDs(): string[] {
    return Object.keys(this.tasksByEmployee);
  }

  updateTask(task: any): void {
    // Implement the task update logic here
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddTaskComponent, {
      width: '800px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'refresh') {
        this.loadTasks();
      }
    });
  }

  openEditDialog(task: any): void {
    const dialogRef = this.dialog.open(EditTaskComponent, {
      width: '800px',
      data: task
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'refresh') {
        this.loadTasks();
      }
    });
  }
}
