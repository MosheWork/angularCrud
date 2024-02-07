import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';

export interface Users {
  employeeID: string;
  firstName: string;
  lastName: string;
  adUserName: string;
  cellNumber: string;
  role: string[];
  department: string[];
  permission: string; // Optional property to hold the permission value
  // ... other properties
  // Add other properties as per your data structure
}

@Component({
  selector: 'app-permissions-dialog',
  templateUrl: './permissions-dialog.component.html',
  styleUrls: ['./permissions-dialog.component.scss'],
})
export class PermissionsDialogComponent {
  permissions: string[] = ['test1', 'test2', 'test3']; // Define the permissions array
  Department: string[] = ['Department 1', 'Department 2', 'Department 3'];



  constructor(
    public dialogRef: MatDialogRef<PermissionsDialogComponent>,
    private http: HttpClient,
    @Inject(MAT_DIALOG_DATA) public user: Users
  ) {
    // Initialize roles and department as empty arrays if they are not already set
    if (!this.user.role) {
      this.user.role = []; // Ensure this is an array
    }
    if (!this.user.department) {
      this.user.department = []; // Ensure this is an array
    }
  
    console.log('Initialized user data:', this.user);
  }
  
  closeDialog(): void {
    this.dialogRef.close();
  }

  updatePermissions(): void {
    const apiUrl = 'http://localhost:7144/api/Users'; // Replace with your actual API URL
  
    // Construct the payload with the expected structure
    const payload = {
      ADUserName: this.user.adUserName,
      Role: this.user.role, // Assuming this is now an array
      Department: this.user.department // Assuming this is also an array
    };
  
    // Log the payload to the console before sending it
    console.log('Sending payload:', payload);
  
    this.http.post(apiUrl, payload).subscribe({
      next: (response) => {
        console.log('Update successful', response);
        this.dialogRef.close(this.user);
      },
      error: (error) => {
        console.error('There was an error!', error);
      },
    });
  }
  
  
}
