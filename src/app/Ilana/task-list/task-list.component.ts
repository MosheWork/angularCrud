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
    'TaskId', 'TaskName', 'Status', 'ChecklistItem1', 'ChecklistItem2', 
    'ChecklistItem3', 'ChecklistItem4', 'StartDate',  'CreatedBy', 
    'AssignedUsers', 'Actions'
  ];
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
        const assignedUsersNames = this.getAssignedUsersNames(task.AssignedUsers);
        return {
          ...task,
          assignedUsersNames: assignedUsersNames,
          ChecklistItem1Counter: this.calculateCounter(task.ChecklistItem1DueDate, task.ChecklistItem1),
          ChecklistItem2Counter: this.calculateCounter(task.ChecklistItem2DueDate, task.ChecklistItem2),
          ChecklistItem3Counter: this.calculateCounter(task.ChecklistItem3DueDate, task.ChecklistItem3),
          ChecklistItem4Counter: this.calculateCounter(task.ChecklistItem4DueDate, task.ChecklistItem4),
        };
      });
    });
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
      AssignedUsers: Array.isArray(task.AssignedUsers) ? task.AssignedUsers : []
    };
    delete updatedTask.assignedUsers; // Ensure there is no duplicate key in the payload
    delete updatedTask.assignedUsersNames; // Ensure there is no duplicate key in the payload
    this.http.put(environment.apiUrl + 'IlanaTaskManager/tasks/' + task.TaskId, updatedTask).subscribe(response => {
      console.log('Task updated', response);
      this.loadTasks();
    });
  }

  onCheckboxChange(task: any, checklistItem: string, checked: boolean): void {
    task[checklistItem] = checked;
    task[`${checklistItem}Counter`] = this.calculateCounter(task[`${checklistItem}DueDate`], checked);
    this.updateTask(task);
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
