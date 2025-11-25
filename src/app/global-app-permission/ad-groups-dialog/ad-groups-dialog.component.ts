import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface AdGroupRow {
  index: number;
  code: string;
  groupDescs: string[];
}

export interface AdGroupsDialogData {
  fullName: string | null;
  adUserName: string | null;
  raw: string;
  groups: AdGroupRow[];
}

@Component({
  selector: 'app-ad-groups-dialog',
  templateUrl: './ad-groups-dialog.component.html',
  styleUrls: ['./ad-groups-dialog.component.scss']
})
export class AdGroupsDialogComponent {
  displayedColumns: string[] = ['index', 'code', 'desc'];
  dataSource: AdGroupRow[];

  constructor(
    public dialogRef: MatDialogRef<AdGroupsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AdGroupsDialogData
  ) {
    this.dataSource = data.groups || [];
  }
}
