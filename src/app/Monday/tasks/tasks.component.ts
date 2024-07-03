import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Define interfaces
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

interface Column {
  id: string;
  title: string;
  type: string;
}

interface Board {
  id: string;
  name: string;
  description?: string;
  columns: Column[];
  items_page: {
    items: Task[];
  };
}

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss']
})
export class TasksComponent implements OnInit {
  tasks: Task[] = [];
  boardId: string = '';
  columnsMetadata: { [key: string]: string } = {};

  constructor(private http: HttpClient, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.boardId = params['boardId'];
      this.getTasks(this.boardId).subscribe(data => {
        const board: Board = data.data.boards[0];
        this.tasks = board.items_page.items.sort((a: Task, b: Task) => a.id.localeCompare(b.id));
        board.columns.forEach(column => {
          this.columnsMetadata[column.id] = column.title;
        });
      });
    });
  }

  getTasks(boardId: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}Monday/boards/${boardId}/tasks`);
  }

  getColumnTitle(columnId: string): string {
    return this.columnsMetadata[columnId] || columnId;
  }
}
