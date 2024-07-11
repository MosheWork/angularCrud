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
  displayedColumns: string[] = ['TaskId', 'TaskName', 'Status', 'StartDate', 'EndDate', 'DueDate', 'IsRecurring', 'Progress', 'Actions'];
  tasks: any[] = [];

  constructor(private http: HttpClient, public dialog: MatDialog) { }

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.http.get<any[]>(environment.apiUrl + 'IlanaTaskManager/tasks').subscribe(data => {
      this.tasks = data.map(task => {
        const progress = this.calculateProgress(task.StartDate, task.DueDate, task.EndDate);
        return {
          ...task,
          progress: progress,
          progressColor: this.getProgressColor(progress)
        };
      });
    });
  }

  calculateProgress(startDate: string, dueDate: string, endDate: string): number {
    const start = new Date(startDate).getTime();
    const due = new Date(dueDate).getTime();
    const now = endDate ? new Date(endDate).getTime() : new Date().getTime();
    if (now >= due) {
      return 100;
    }
    if (now <= start) {
      return 0;
    }
    return ((now - start) / (due - start)) * 100;
  }

  getProgressColor(progress: number): string {
    if (progress < 80) {
      return 'mat-progress-bar-green';
    } else if (progress < 100) {
      return 'mat-progress-bar-orange';
    } else {
      return 'mat-progress-bar-red';
    }
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddTaskComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'refresh') {
        this.loadTasks();
      }
    });
  }

  openEditDialog(task: any): void {
    const dialogRef = this.dialog.open(EditTaskComponent, {
      width: '400px',
      data: task
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'refresh') {
        this.loadTasks();
      }
    });
  }
}
