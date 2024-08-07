import { Component, Input, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

interface GroupSummary {
  total: number;
  statuses: { [key: string]: number };
}

interface UserSummary {
  total: number;
  statuses: { [key: string]: number };
}

@Component({
  selector: 'app-task-summary',
  templateUrl: './task-summary.component.html',
  styleUrls: ['./task-summary.component.scss']
})
export class TaskSummaryComponent implements OnInit, OnChanges {
  @Input() boardId: string = '';
  groupSummary: { [key: string]: GroupSummary } = {};
  userSummary: { [key: string]: UserSummary } = {};
  displayedColumns: string[] = [];
  statusKeys: string[] = [];
  displayedUserColumns: string[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchGroupSummaryData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['boardId'] && !changes['boardId'].firstChange) {
      this.fetchGroupSummaryData();
    }
  }

  fetchGroupSummaryData(): void {
    forkJoin([this.getTasks(this.boardId), this.getColumns(this.boardId)]).subscribe(
      ([tasksData, columnsData]) => {
        const boardData = tasksData?.data?.boards?.[0];
        if (boardData) {
          this.groupSummary = this.calculateGroupSummary(boardData);
          this.userSummary = this.calculateUserSummary(boardData);
          this.updateDisplayedColumns();
          this.updateDisplayedUserColumns();
        } else {
          console.error('Invalid response structure:', tasksData);
        }
      },
      (error) => {
        console.error('API call failed:', error);
      }
    );
  }

  getTasks(boardId: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}Monday/boards/${boardId}/tasks`);
  }

  getColumns(boardId: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}Monday/boards/${boardId}/columns`);
  }

  calculateGroupSummary(board: Board): { [key: string]: GroupSummary } {
    const groupSummary: { [key: string]: GroupSummary } = {};
    board.groups.forEach(group => {
      const summary: GroupSummary = {
        total: 0,
        statuses: {}
      };
      group.items_page.items.forEach(task => {
        summary.total++;
        const status = task.column_values.find(col => col.id === 'status');
        if (status && status.text) {
          if (!summary.statuses[status.text]) {
            summary.statuses[status.text] = 0;
          }
          summary.statuses[status.text]++;
        }
      });
      groupSummary[group.title] = summary;
    });
    return groupSummary;
  }

  calculateUserSummary(board: Board): { [key: string]: UserSummary } {
    const userSummary: { [key: string]: UserSummary } = {};
    board.groups.forEach(group => {
      group.items_page.items.forEach(task => {
        const assignedTo = task.column_values.find(col => col.id === 'assigned_to');
        const status = task.column_values.find(col => col.id === 'status');
        if (assignedTo && assignedTo.text) {
          if (!userSummary[assignedTo.text]) {
            userSummary[assignedTo.text] = {
              total: 0,
              statuses: {}
            };
          }
          userSummary[assignedTo.text].total++;
          if (status && status.text) {
            if (!userSummary[assignedTo.text].statuses[status.text]) {
              userSummary[assignedTo.text].statuses[status.text] = 0;
            }
            userSummary[assignedTo.text].statuses[status.text]++;
          }
        }
      });
    });
    return userSummary;
  }

  updateDisplayedColumns(): void {
    this.statusKeys = Array.from(
      new Set(
        Object.values(this.groupSummary)
          .reduce((acc, summary: GroupSummary) => acc.concat(Object.keys(summary.statuses)), [] as string[])
      )
    );
    this.displayedColumns = ['group', 'total', ...this.statusKeys];
  }

  updateDisplayedUserColumns(): void {
    this.statusKeys = Array.from(
      new Set(
        Object.values(this.userSummary)
          .reduce((acc, summary: UserSummary) => acc.concat(Object.keys(summary.statuses)), [] as string[])
      )
    );
    this.displayedUserColumns = ['user', 'total', ...this.statusKeys];
  }

  get groupSummaryKeys(): string[] {
    return Object.keys(this.groupSummary);
  }

  get userSummaryKeys(): string[] {
    return Object.keys(this.userSummary);
  }
}
