import { Component, OnInit, AfterViewInit, ViewChildren, QueryList } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
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
export class TasksComponent implements OnInit, AfterViewInit {
  board: Board | null = null;
  boardId: string = '';
  displayedColumns: string[] = ['name'];
  dynamicColumns: ColumnValue[] = [];
  groupDataSources: { [key: string]: MatTableDataSource<Task> } = {};
  columnTitles: { [key: string]: string } = {};  // Store column titles here

  @ViewChildren(MatPaginator) paginators!: QueryList<MatPaginator>;
  @ViewChildren(MatSort) sorts!: QueryList<MatSort>;

  constructor(private http: HttpClient, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.boardId = params['boardId'];
      forkJoin([
        this.getTasks(this.boardId),
        this.getColumns(this.boardId)
      ]).subscribe(([tasksData, columnsData]) => {
        console.log('Tasks response:', tasksData);
        console.log('Columns response:', columnsData);

        const boardData = tasksData?.data?.boards?.[0];
        if (boardData) {
          this.board = boardData;
          this.columnTitles = columnsData?.data?.boards?.[0]?.columns.reduce((acc: { [key: string]: string }, column: Column) => {
            acc[column.id] = column.title;
            return acc;
          }, {});

          this.extractDynamicColumns();
          this.setupDataSources();
        } else {
          console.error('Invalid response structure:', tasksData);
        }
      }, error => {
        console.error('API call failed:', error);
      });
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.setupDataSources();
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
        this.dynamicColumns = firstTask.column_values.map(col => ({
          ...col,
          title: this.columnTitles[col.id] || col.id  // Use title from columnTitles
        }));
        this.displayedColumns = ['name', ...this.dynamicColumns.map(col => col.id)];
        console.log('Dynamic columns:', this.dynamicColumns);
      }
    }
  }

  setupDataSources(): void {
    if (this.board) {
      this.board.groups.forEach((group, index) => {
        console.log(`Setting up data source for group: ${group.title}`);
        const dataSource = new MatTableDataSource(group.items_page.items);
        console.log(`Data source items for group ${group.title}:`, group.items_page.items);
        this.groupDataSources[group.id] = dataSource;
        setTimeout(() => {
          const paginator = this.paginators.toArray()[index];
          const sort = this.sorts.toArray()[index];
          if (paginator && sort) {
            dataSource.paginator = paginator;
            dataSource.sort = sort;
            paginator.length = group.items_page.items.length;
            paginator.pageIndex = 0;
            console.log(`Group: ${group.title}, Items: ${group.items_page.items.length}, Paginator length: ${paginator.length}`);
          } else {
            console.error(`Paginator or sort not found for group: ${group.title}`);
          }
        }, 0);
      });
    }
  }

  getGroupDataSource(group: Group): MatTableDataSource<Task> {
    return this.groupDataSources[group.id];
  }

  getColumnText(columnValues: ColumnValue[], columnId: string): string {
    const column = columnValues.find(col => col.id === columnId);
    return column ? (column.text || '') : '';
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    for (const key in this.groupDataSources) {
      if (this.groupDataSources.hasOwnProperty(key)) {
        this.groupDataSources[key].filter = filterValue;
      }
    }
  }
}
