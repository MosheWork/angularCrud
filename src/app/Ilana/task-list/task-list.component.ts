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
  displayedColumns: string[] = [
    'TaskId', 'TaskName', 'StartDate', 'EmployeeName', 'EmployeeID', 
    'ChecklistItem1', 'ChecklistItem2', 'ChecklistItem3', 'ChecklistItem4', 'Actions'
  ];
  tasks: any[] = [];
  users: any[] = [];

  constructor(private http: HttpClient, public dialog: MatDialog) { }

  ngOnInit(): void {
    this.loadUsers();
    this.loadTasks();
  }

  loadUsers(): void {
    this.http.get<any[]>(environment.apiUrl + 'IlanaTaskManager/employees').subscribe(data => {
      this.users = data;
    });
  }

  loadTasks(): void {
    this.http.get<any[]>(environment.apiUrl + 'IlanaTaskManager/tasks').subscribe(data => {
      this.tasks = data;
    });
  }

  onCheckboxChange(task: any, checklistItem: string, checked: boolean): void {
    task[checklistItem] = checked;
    task[`${checklistItem}Counter`] = this.calculateCounter(task[`${checklistItem}DueDate`], checked);
    this.updateTask(task);
  }

  calculateCounter(dueDate: string, checked: boolean): string {
    if (checked) {
      return 'Completed';
    }
    const due = new Date(dueDate).getTime();
    const now = new Date().getTime();
    const timeLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24)); // days left
    return timeLeft > 0 ? `${timeLeft} days left` : 'Overdue';
  }

  updateTask(task: any): void {
    this.http.put(environment.apiUrl + 'IlanaTaskManager/tasks/' + task.TaskId, task).subscribe(response => {
      console.log('Task updated', response);
      this.loadTasks();
    });
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
