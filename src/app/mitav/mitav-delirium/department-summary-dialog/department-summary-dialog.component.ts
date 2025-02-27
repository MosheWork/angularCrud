import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-department-summary-dialog',
  templateUrl: './department-summary-dialog.component.html',
  styleUrls: ['./department-summary-dialog.component.scss']
})
export class DepartmentSummaryDialogComponent implements OnInit {
  displayedColumns: string[] = ['department', 'totalCAMCases', 'validCAMCount', 'validPercentage'];
  dataSource: MatTableDataSource<any>;

  constructor(
    public dialogRef: MatDialogRef<DepartmentSummaryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.dataSource = new MatTableDataSource(data);
  }

  ngOnInit(): void {
    this.dataSource.data.sort((a, b) => b.validPercentage - a.validPercentage); // ✅ Sort data before display
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
