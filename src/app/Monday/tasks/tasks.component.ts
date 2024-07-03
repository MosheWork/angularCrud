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
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss']
})
export class TasksComponent implements OnInit {
  board: Board | null = null;
  boardId: string = '';
  displayedColumns: string[] = ['name'];
  dynamicColumns: ColumnValue[] = [];

  constructor(private http: HttpClient, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.boardId = params['boardId'];
      this.getTasks(this.boardId).subscribe(data => {
        console.log('Response data:', data);  // Log the response data for debugging
        const boardData = data?.data?.boards?.[0];
        if (boardData) {
          this.board = boardData;
          this.extractDynamicColumns();
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

  extractDynamicColumns(): void {
    if (this.board && this.board.groups.length > 0) {
      const firstGroup = this.board.groups[0];
      if (firstGroup.items_page.items.length > 0) {
        const firstTask = firstGroup.items_page.items[0];
        this.dynamicColumns = firstTask.column_values;
        this.displayedColumns = ['name', ...this.dynamicColumns.map(col => col.id)];
      }
    }
  }

  getColumnText(columnValues: ColumnValue[], columnId: string): string {
    const column = columnValues.find(col => col.id === columnId);
    return column ? (column.text || 'No text available') : '';
  }
}
