import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';

export interface Users {
  employeeID: string;
  firstName: string;
  lastName: string;
  adUserName: string;
  cellNumber: string;
  roles: string[];
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
  // Temporary properties for selections
  selectedRoles: string[] = [];
  selectedDepartments: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<PermissionsDialogComponent>,
    private http: HttpClient,
    @Inject(MAT_DIALOG_DATA) public user: Users,
    private cdr: ChangeDetectorRef
  ) {
    let tempRoleArray: any = this.user.roles;
    let tempDepartmentArray: any = this.user.department;

    // Initialize temporary selections with current user values
    this.selectedRoles = Array.isArray(this.user.roles)
      ? [...this.user.roles]
      : [];
    this.selectedDepartments = Array.isArray(this.user.department)
      ? [...this.user.department]
      : [];

      //split change the string to arry
      this.user.roles = tempRoleArray.split(',');
      this.user.department = tempRoleArray.split(',');
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
      Role: this.selectedRoles, // Assuming this is now an array
      Department: this.selectedDepartments, // Assuming this is also an array
    };

    // Log the payload to the console before sending it
    console.log('Sending payload:', payload);

    this.http.post(apiUrl, payload).subscribe({
      next: (response) => {
        console.log('Update successful', response);
        // Update user's roles and departments with the temporary selections upon successful save
        this.user.roles = [...this.selectedRoles];
        this.user.department = [...this.selectedDepartments];
        this.dialogRef.close(this.user); // Pass back the updated user object if needed
      },
      error: (error) => {
        console.error('There was an error!', error);
      },
    });
  }
  toggleRoleSelection(role: string, isChecked: boolean): void {
    const index = this.selectedRoles.indexOf(role);
    if (isChecked) {
      if (index === -1) {
        this.selectedRoles.push(role);
      }
    } else {
      if (index !== -1) {
        this.selectedRoles.splice(index, 1);
      }
    }
  }

  toggleDepartmentSelection(department: string, isChecked: boolean): void {
    const index = this.selectedDepartments.indexOf(department);
    if (isChecked) {
      if (index === -1) {
        this.selectedDepartments.push(department);
      }
    } else {
      if (index !== -1) {
        this.selectedDepartments.splice(index, 1);
      }
    }
  }
  updateUserPermissions() {
    const payload = {
      ...this.user, // Keep the existing user details
      roles: this.selectedRoles, // New roles from checkboxes
      department: this.selectedDepartments, // New departments from checkboxes
    };
  
    // Call your API to update the user details
    this.http.put(`your-api-endpoint/users/${this.user.employeeID}`, payload)
      .subscribe({
        next: (response) => {
          console.log('User permissions updated successfully', response);
          this.dialogRef.close(payload); // Close the dialog and pass the updated user data
        },
        error: (error) => {
          console.error('Failed to update user permissions', error);
        }
      });
  }
  
}
