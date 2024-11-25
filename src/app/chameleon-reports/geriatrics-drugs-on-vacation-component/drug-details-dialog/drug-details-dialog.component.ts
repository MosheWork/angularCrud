import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-drug-details-dialog',
  templateUrl: './drug-details-dialog.component.html',
  styleUrls: ['./drug-details-dialog.component.scss'],
})
export class DrugDetailsDialogComponent implements OnInit {
  displayedColumns: string[] = ['Way_Of_Giving', 'Drugs_Text', 'TimingString'];
  dataSource: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<DrugDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data && Array.isArray(data)) {
      this.dataSource = data;
    }
  }

  ngOnInit(): void {
    console.log('Data passed to dialog:', this.data); // Log the data
    console.log('DataSource for table:', this.dataSource); // Log the data source used in the table
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
