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
interface Role {
  key: string;
  value?: string; // Include other properties as needed, marking optional ones with ?
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
    { key: 'RoleAdmin', value: 'Admin' },
    { key: 'RoleAdminViewer', value: 'Admin Viewer' },
    { key: 'RoleUser', value: 'User' },
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
  locale: undefined
};

selectedDepartments: Department[] = []; // Will be populated based on user selection

  selectedRoles: Role[] = []; // Now explicitly typed as an array of Role objects

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
    this.fetchUserPermissions(this.user.adUserName).subscribe(
      (permissions: any) => {
        this.department1 = permissions.Department1;
        this.department2 = permissions.Department2;
        this.department3 = permissions.Department3;
        this.roleAdmin = permissions.RoleAdmin;
        this.roleAdminViewer = permissions.RoleAdminViewer;
        this.roleUser = permissions.RoleUser;
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
    const apiUrl = 'http://localhost:7144/api/Users';
  
    // Helper function to check if a role is selected
    const isRoleSelected = (roleKey: string) => this.selectedRoles.some(role => role.key === roleKey);
    // Helper function to check if a department is selected
    const isDepartmentSelected = (departmentKey: string) => this.selectedDepartments.some(dept => dept.key === departmentKey);

  
    const payload = {
      ADUserName: this.user.adUserName,
      // Use the helper function to check if each role is selected
      roleAdmin: isRoleSelected('RoleAdmin'),
      roleAdminViewer: isRoleSelected('RoleAdminViewer'),
      roleUser: isRoleSelected('RoleUser'),
      department1: isDepartmentSelected('Department1'),
      department2: isDepartmentSelected('Department2'),
      department3: isDepartmentSelected('Department3'),
      // Include other data as needed...
    };
  
    console.log('Sending payload:', payload);
  
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
