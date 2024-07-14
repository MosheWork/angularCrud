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
  displayedColumns: string[] = ['TaskId', 'TaskName', 'Status', 'Checklist1', 'Checklist2', 'Checklist3', 'Checklist4', 'StartDate', 'IsRecurring', 'CreatedBy', 'AssignedUsers', 'Actions'];
  tasks: any[] = [];
  users: any[] = [];
  statusOptions: string[] = ['Not Started', 'In Progress', 'Completed'];

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
      this.tasks = data.map(task => {
        task.ChecklistItem1Counter = this.calculateCounter(task.StartDate, task.ChecklistItem1DueDate);
        task.ChecklistItem2Counter = this.calculateCounter(task.StartDate, task.ChecklistItem2DueDate);
        task.ChecklistItem3Counter = this.calculateCounter(task.StartDate, task.ChecklistItem3DueDate);
        task.ChecklistItem4Counter = this.calculateCounter(task.StartDate, task.ChecklistItem4DueDate);
        return {
          ...task,
          assignedUsers: this.getAssignedUsersNames(task.AssignedUsers)
        };
      });
    });
  }
  
  calculateCounter(startDate: string, dueDate: string): string {
    if (!dueDate) {
      return 'N/A';
    }
    const start = new Date(startDate).getTime();
    const due = new Date(dueDate).getTime();
    const now = new Date().getTime();
    const timeLeft = due - now;
    const daysLeft = Math.ceil(timeLeft / (1000 * 3600 * 24));
    return daysLeft > 0 ? `${daysLeft} days left` : 'Due';
  }
  
  getAssignedUsersNames(assignedUsers: number[]): string {
    if (!assignedUsers || assignedUsers.length === 0) {
      return 'No users assigned';
    }
    const userNames = assignedUsers.map(userId => {
      const user = this.users.find(user => user.EmployeeID === userId);
      return user ? user.Name : 'Unknown';
    });
    return userNames.join(', ');
  }

  updateTask(task: any): void {
    const updatedTask = {
      ...task,
      AssignedUsers: task.AssignedUsers.filter((user: any) => user !== null).map((user: any) => typeof user === 'number' ? user : user.EmployeeID)
    };
    this.http.put(environment.apiUrl + 'IlanaTaskManager/tasks/' + task.TaskId, updatedTask).subscribe(response => {
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
