import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';

export interface Users {
  employeeID: string;
  firstName: string;
  lastName: string;
  adUserName: string;
  cellNumber: string;
}

@Component({
  selector: 'app-permissions-dialog',
  templateUrl: './permissions-dialog.component.html',
  styleUrls: ['./permissions-dialog.component.scss'],
})
export class PermissionsDialogComponent implements OnInit {
  permissions: string[] = ['RoleAdmin', 'RoleAdminViewer', 'RoleUser']; 
  departments: string[] = ['Department1', 'Department2', 'Department3'];

  // Initialize flags for checkboxes
  department1: boolean = false;
  department2: boolean = false;
  department3: boolean = false;
  roleAdmin: boolean = false;
  roleAdminViewer: boolean = false;
  roleUser: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<PermissionsDialogComponent>,
    private http: HttpClient,
    @Inject(MAT_DIALOG_DATA) public user: Users
  ) {}

  ngOnInit(): void {
    this.fetchUserPermissions(this.user.adUserName).subscribe((permissions: any) => {
      this.fetchUserPermissions(this.user.adUserName).subscribe((permissions: any) => {
        this.department1 = permissions.Department1;
        this.department2 = permissions.Department2;
        this.department3 = permissions.Department3;
        this.roleAdmin = permissions.RoleAdmin;
        this.roleAdminViewer = permissions.RoleAdminViewer;
        this.roleUser = permissions.RoleUser;
      });
    });
  }

  fetchUserPermissions(adUserName: string) {
    const apiUrl = `http://localhost:7144/api/Users/${adUserName}`;
    return this.http.get(apiUrl);
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  updatePermissions(): void {
    const apiUrl = 'http://localhost:7144/api/Users';

    const payload = {
      ADUserName: this.user.adUserName,
      Department1: this.department1,
      Department2: this.department2,
      Department3: this.department3,
      RoleAdmin: this.roleAdmin,
      RoleAdminViewer: this.roleAdminViewer,
      RoleUser: this.roleUser
    };

    this.http.post(apiUrl, payload).subscribe({
      next: (response) => {
        console.log('Update successful', response);
        this.dialogRef.close(); 
      },
      error: (error) => {
        console.error('There was an error!', error);
      },
    });
  }
  

  // updateUserPermissions() {
  //   const payload = {
  //     ...this.user,
  //     Department1: this.department1,
  //     Department2: this.department2,
  //     Department3: this.department3,
  //     RoleAdmin: this.roleAdmin,
  //     RoleAdminViewer: this.roleAdminViewer,
  //     RoleUser: this.roleUser
  //   };
  
  //   this.http.put(`your-api-endpoint/users/${this.user.employeeID}`, payload)
  //     .subscribe({
  //       next: (response) => {
  //         console.log('User permissions updated successfully', response);
  //         this.dialogRef.close(payload); 
  //       },
  //       error: (error) => {
  //         console.error('Failed to update user permissions', error);
  //       }
  //     });
  // }
}
