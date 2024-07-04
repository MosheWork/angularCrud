import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
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

@Component({
  selector: 'app-task-summary',
  templateUrl: './task-summary.component.html',
  styleUrls: ['./task-summary.component.scss'],
})
export class TaskSummaryComponent implements OnInit, OnChanges {
  @Input() boardId: string = '';
  groupSummary: { [key: string]: GroupSummary } = {};
  displayedColumns: string[] = [];
  statusKeys: string[] = [];

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
    forkJoin([
      this.getTasks(this.boardId),
      this.getColumns(this.boardId),
    ]).subscribe(
      ([tasksData, columnsData]) => {
        const boardData = tasksData?.data?.boards?.[0];
        if (boardData) {
          this.groupSummary = this.calculateGroupSummary(boardData);
          this.updateDisplayedColumns();
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
    return this.http.get(
      `${environment.apiUrl}Monday/boards/${boardId}/columns`
    );
  }

  calculateGroupSummary(board: Board): { [key: string]: GroupSummary } {
    const groupSummary: { [key: string]: GroupSummary } = {};
    board.groups.forEach((group) => {
      const summary: GroupSummary = {
        total: 0,
        statuses: {},
      };
      group.items_page.items.forEach((task) => {
        summary.total++;
        const status = task.column_values.find((col) => col.id === 'status');
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

  updateDisplayedColumns(): void {
    this.statusKeys = Array.from(
      new Set(
        Object.values(this.groupSummary)
          .reduce((acc, summary: GroupSummary) => acc.concat(Object.keys(summary.statuses)), [] as string[])
      )
    );
    // Define the new order of the columns here
    this.displayedColumns = ['group', 'total', 'טופל', 'בעבודה',  'לא ניתן לטפל', 'בהמתנה'];
  }

  get groupSummaryKeys(): string[] {
    return Object.keys(this.groupSummary);
  }
  
}
