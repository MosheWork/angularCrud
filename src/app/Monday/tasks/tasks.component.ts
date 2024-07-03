import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

interface ColumnValue {
  id: string;
  type: string;
  text: string | null;
}

interface Task {
  id: string;
  name: string;
  column_values: ColumnValue[];
}

interface Group {
  id: string;
  title: string;
  items_page: {
    items: Task[];
  };
}

interface Board {
  id: string;
  name: string;
  description?: string;
  groups: Group[];
}

@Component({
  selector: 'app-tasks',
  template: `
  <div *ngIf="board">
    <h2>Tasks for Board ID: {{ board.id }}</h2>
    <div *ngFor="let group of board.groups">
      <h3>{{ group.title }}</h3>
      <div *ngFor="let task of group.items_page.items">
        <mat-card class="task-card">
          <mat-card-title>{{ task.name }}</mat-card-title>
          <mat-card-content>
            <div *ngFor="let column of task.column_values">
              <p>
                <strong>{{ column.id }} ({{ column.type }}):</strong> {{ column.text || 'No text available' }}
              </p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  </div>
  `,
  styleUrls: ['./tasks.component.scss']
})
export class TasksComponent implements OnInit {
  board: Board | null = null;
  boardId: string = '';

  constructor(private http: HttpClient, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.boardId = params['boardId'];
      this.getTasks(this.boardId).subscribe(data => {
        console.log('Response data:', data);  // Log the response data for debugging
        const boardData = data?.data?.boards?.[0];
        if (boardData) {
          this.board = boardData;
        } else {
          console.error('Invalid response structure:', data);
        }
      }, error => {
        console.error('API call failed:', error);
      });
    });
  }

  getTasks(boardId: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}Monday/boards/${boardId}/tasks`);
  }
}
