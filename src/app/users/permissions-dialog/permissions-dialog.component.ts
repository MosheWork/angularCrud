import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment'

export interface Users {
  employeeID: string;
  firstName: string;
  lastName: string;
  adUserName: string;
  cellNumber: string;
}
interface Role {
  key: string;
  value: string;
}
interface Department {
  key: string;
  value: string;
}
@Component({
  selector: 'app-permissions-dialog',
  templateUrl: './permissions-dialog.component.html',
  styleUrls: ['./permissions-dialog.component.scss'],
})
export class PermissionsDialogComponent implements OnInit {
  // Source array for the dual list box
  availableRoles: Role[] = [
    { key: 'RoleAdmin', value: 'RoleAdmin' },
    { key: 'RoleAdminViewer', value: 'RoleAdminViewer' },
    { key: 'RoleUser', value: 'RoleUser' },
  ];
  // Inside PermissionsDialogComponent
  availableDepartments: Department[] = [
    { key: 'Department1', value: 'Department 1' },
    { key: 'Department2', value: 'Department 2' },
    { key: 'Department3', value: 'Department 3' },
    // Add more departments as needed
  ];

  format = {
    add: 'הוסף', // Translated 'Add' to Hebrew
    remove: 'הסר', // Translated 'Remove' to Hebrew
    all: 'הכל', // Translated 'All' to Hebrew
    none: 'מחק', // Translated 'None' to Hebrew
    direction: 'left-to-right', // Set direction to RTL
    draggable: true,
    locale: undefined,
  };

  selectedDepartments: Department[] = []; // Will be populated based on user selection

  selectedRoles: Role[] = []; // Now explicitly typed as an array of Role objects

  // permissions: string[] = ['RoleAdmin', 'RoleAdminViewer', 'RoleUser'];
  // departments: string[] = ['Department1', 'Department2', 'Department3'];

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
    this.fetchUserPermissions(this.user.adUserName).subscribe(
      (permissions: any) => {
        // this.department1 = permissions.Department1;
        // this.department2 = permissions.Department2;
        // this.department3 = permissions.Department3;
        // this.roleAdmin = permissions.RoleAdmin;
        // this.roleAdminViewer = permissions.RoleAdminViewer;
        // this.roleUser = permissions.RoleUser;
        console.log(permissions);

        this.availableRoles = [
          { key: 'RoleAdmin', value: 'RoleAdmin' },
          { key: 'RoleAdminViewer', value: 'RoleAdminViewer' },
          { key: 'RoleUser', value: 'RoleUser' },
        ];

        this.availableDepartments = [
          { key: 'Department1', value: 'Department 1' },
          { key: 'Department2', value: 'Department 2' },
          { key: 'Department3', value: 'Department 3' },
          // Add more departments as needed
        ];
        this.fetchUserPermissions(this.user.adUserName).subscribe(
          (permissions: any) => {
            this.selectedDepartments = this.availableDepartments.filter(
              (department) => permissions[department.key.toLowerCase()]
            );
            this.selectedRoles = this.availableRoles.filter(
              (role) => permissions[role.key.toLowerCase()]
            );
            console.log('Selected Departments:', this.selectedDepartments);
            console.log('Selected Roles:', this.selectedRoles);
          }
        );
      }
    );
  }

  fetchUserPermissions(rowId: string) {
    const apiUrl = `http://localhost:7144/api/Users/${this.user.adUserName}`;
    return this.http.get(apiUrl);
    console.log(this.user.adUserName);
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  updatePermissions(): void {
    const apiUrl = environment.apiUrl + 'Users';

    // Constructing payload based on selectedRoles and selectedDepartments
    const payload = {
      ADUserName: this.user.adUserName,
      // Dynamically create entries for each role and department
      ...this.availableRoles.reduce(
        (acc, role) => ({
          ...acc,
          [role.key]: this.selectedRoles.some(
            (selectedRole) => selectedRole.key === role.key
          ),
        }),
        {}
      ),
      ...this.availableDepartments.reduce(
        (acc, dept) => ({
          ...acc,
          [dept.key]: this.selectedDepartments.some(
            (selectedDept) => selectedDept.key === dept.key
          ),
        }),
        {}
      ),
    };

    this.http.post(apiUrl, payload).subscribe({
      next: (response: any) => {
        console.log('Update successful', response);
        this.dialogRef.close();
      },
      error: (error: any) => {
        console.error('There was an error!', error);
      },
    });
  }
}
