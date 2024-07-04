import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

interface GroupSummary {
  total: number;
  statuses: { [key: string]: number };
}

@Component({
  selector: 'app-task-summary',
  templateUrl: './task-summary.component.html',
  styleUrls: ['./task-summary.component.scss']
})
export class TaskSummaryComponent implements OnChanges {
  @Input() groupSummary: { [key: string]: GroupSummary } = {};
  displayedColumns: string[] = [];
  statusKeys: string[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['groupSummary'] && this.groupSummary) {
      this.statusKeys = Array.from(
        new Set(
          Object.values(this.groupSummary)
            .reduce((acc: string[], summary: GroupSummary) => acc.concat(Object.keys(summary.statuses)), [])
        )
      );
      this.displayedColumns = ['group', 'total', ...this.statusKeys];
    }
  }
}
