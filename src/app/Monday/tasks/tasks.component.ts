import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { Observable, forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';

interface ColumnValue {
  id: string;
  type: string;
  text: string | null;
  title: string;
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
  isCollapsed?: boolean;
}

interface Board {
  id: string;
  name: string;
  description?: string;
  groups: Group[];
}

interface Column {
  id: string;
  title: string;
  type: string;
}

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss']
})
export class TasksComponent implements OnInit {
  board: Board | null = null;
  boardId: string = '';
  displayedColumns: string[] = ['task_name', 'subitems', 'assigned', 'unique_name', 'requester_name', 'status', 'priority', 'due_date', 'expected_end_date', 'reading'];
  dynamicColumns: ColumnValue[] = [];
  columnTitles: { [key: string]: string } = {};
  groupDataSources: { [key: string]: MatTableDataSource<Task> } = {};
  uniqueStatusValues: string[] = [];
  selectedStatuses: string[] = [];

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.boardId = params['boardId'];
      forkJoin([this.getTasks(this.boardId), this.getColumns(this.boardId)]).subscribe(
        ([tasksData, columnsData]) => {
          console.log('Tasks response:', tasksData);
          console.log('Columns response:', columnsData);

          const boardData = tasksData?.data?.boards?.[0];
          if (boardData) {
            this.board = boardData;
            this.columnTitles = columnsData?.data?.boards?.[0]?.columns.reduce(
              (acc: { [key: string]: string }, column: Column) => {
                acc[column.id] = column.title;
                return acc;
              },
              {}
            );

            this.extractDynamicColumns();
            this.setupDataSources();
            this.extractUniqueStatusValues();

            if (this.board && this.board.groups) {
              this.board.groups.forEach((group) => (group.isCollapsed = true));
            }
          } else {
            console.error('Invalid response structure:', tasksData);
          }
        },
        (error) => {
          console.error('API call failed:', error);
        }
      );
    });
  }

  getTasks(boardId: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}Monday/boards/${boardId}/tasks`);
  }

  getColumns(boardId: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}Monday/boards/${boardId}/columns`);
  }

  extractDynamicColumns(): void {
    if (this.board && this.board.groups.length > 0) {
      const firstGroup = this.board.groups[0];
      if (firstGroup.items_page.items.length > 0) {
        const firstTask = firstGroup.items_page.items[0];
        this.dynamicColumns = firstTask.column_values.map((col) => ({
          ...col,
          title: this.getColumnTitle(col.id),
        }));
        this.displayedColumns = ['name', ...this.dynamicColumns.map((col) => col.id)];
      }
    }
  }

  setupDataSources(): void {
    if (this.board) {
      this.board.groups.forEach((group) => {
        console.log(`Setting up data source for group: ${group.title}`);
        const dataSource = new MatTableDataSource(group.items_page.items);
        console.log(`Data source items for group ${group.title}:`, group.items_page.items);
        this.groupDataSources[group.id] = dataSource;
      });
    }
  }

  getGroupDataSource(group: Group): MatTableDataSource<Task> {
    return this.groupDataSources[group.id];
  }

  getColumnText(columnValues: ColumnValue[], columnId: string): string {
    const column = columnValues.find((col) => col.id === columnId);
    return column ? column.text || '' : '';
  }

  applyColumnFilter(event: Event, columnId: string, groupId: string): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    if (this.groupDataSources.hasOwnProperty(groupId)) {
      this.groupDataSources[groupId].filterPredicate = (data: Task, filter: string) => {
        const columnText = this.getColumnText(data.column_values, columnId).toLowerCase();
        return columnText.includes(filter);
      };
      this.groupDataSources[groupId].filter = filterValue;
      if (filterValue === '') {
        this.groupDataSources[groupId].filterPredicate = (data: Task, filter: string) => {
          return true; // reset to default behavior
        };
      }
    }
  }

  getColumnTitle(column: string): string {
    switch (column) {
      case 'task_name': return 'Task Name';
      case 'subitems': return 'Subitems (subtasks)';
      // Add other column mappings here
      default: return this.columnTitles[column] || column;
    }
  }

  toggleGroup(group: Group): void {
    group.isCollapsed = !group.isCollapsed;
  }

  extractUniqueStatusValues(): void {
    const statuses = new Set<string>();
    this.board?.groups.forEach(group => {
      group.items_page.items.forEach(task => {
        const status = task.column_values.find(col => col.id === 'status');
        if (status && status.text) {
          statuses.add(status.text);
        }
      });
    });
    this.uniqueStatusValues = Array.from(statuses);
  }

  applyStatusFilter(): void {
    this.board?.groups.forEach(group => {
      if (this.groupDataSources.hasOwnProperty(group.id)) {
        this.groupDataSources[group.id].filterPredicate = (data: Task, filter: string) => {
          const columnText = this.getColumnText(data.column_values, 'status').toLowerCase();
          return this.selectedStatuses.length === 0 || this.selectedStatuses.includes(columnText);
        };
        this.groupDataSources[group.id].filter = this.selectedStatuses.join(',');
      }
    });
  }
}
