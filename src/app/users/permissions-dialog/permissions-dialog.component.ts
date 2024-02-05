import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface Users {
  employeeID: string;
  firstName: string;
  lastName: string;
  adUserName: string;
  cellNumber: string;
  permission?: string; // Optional property to hold the permission value
  // ... other properties
  // Add other properties as per your data structure
}

@Component({
  selector: 'app-permissions-dialog',
  templateUrl: './permissions-dialog.component.html',
  styleUrls: ['./permissions-dialog.component.scss']
})
export class PermissionsDialogComponent {

  permissions: string[] = ['Permission1', 'Permission2', 'Permission3']; // Define the permissions array

  constructor(
    public dialogRef: MatDialogRef<PermissionsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public user: Users // Renamed data to user for clarity
  ) {}

  closeDialog(): void {
    this.dialogRef.close();
  }

  updatePermissions(): void {
    this.dialogRef.close(this.user); // Returning the updated user object
  }
}
