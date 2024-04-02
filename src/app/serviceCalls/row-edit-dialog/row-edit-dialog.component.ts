import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-row-edit-dialog',
  templateUrl: './row-edit-dialog.component.html',
  styleUrls: ['./row-edit-dialog.component.scss']
})
export class RowEditDialogComponent {
  // Inject both MatDialogRef and MAT_DIALOG_DATA into your component's constructor
  constructor(
    public dialogRef: MatDialogRef<RowEditDialogComponent>, // Add this line
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  objectKeys = Object.keys;

  save(): void {
    this.dialogRef.close(this.data); // Now dialogRef is recognized
  }

  getType(key: string): string {
    const typeMap: {[key: string]: string} = {
      TimeOpened: 'datetime-local',
      TimeClosed: 'datetime-local',
      // Add other fields with specific types here
      UserRequestedEmployeeID: 'number',
      UserInChargeEmployeeID: 'number'
    };
    return typeMap[key] || 'text'; // Default to text if not specified
  }
  
}
