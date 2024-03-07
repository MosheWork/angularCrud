import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';
import { environment } from '../../../environments/environment'
export interface Users {
  employeeID: string;
  firstName: string;
  lastName: string;
  adUserName: string;
  display: string;
}
interface DialogData {
  users: Users[];
  linkAdress: string;
}

@Component({
  selector: 'app-permissions-dialog-new',
  templateUrl: './permissions-dialog-new.component.html',
  styleUrls: ['./permissions-dialog-new.component.scss'],
})
export class PermissionsDialogNewComponent implements OnInit {
  format = {
    add: 'הוסף', // Translated 'Add' to Hebrew
    remove: 'הסר', // Translated 'Remove' to Hebrew
    all: 'הכל', // Translated 'All' to Hebrew
    none: 'מחק', // Translated 'None' to Hebrew
    direction: 'left-to-right', // Set direction to RTL
    draggable: true,
    locale: undefined,
  };

  linkAdress: string;

  users: Users[]; // Assuming you want to pass an array of Users
  filteredUsers: Users[] = []; // Add this line to hold the filtered list

  selectedUsers: Users[] = [];
  selectedUsersNotToFilter: Users[] = [];
  filteredSelectedUsers: Users[] = []; // You will use this to hold the filtered list of selected users

  constructor(
    private http: HttpClient,
    public dialogRef: MatDialogRef<PermissionsDialogNewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData, // Correct the type here
    private cdr: ChangeDetectorRef
  ) {
    this.users = data.users; // Correctly access users
    this.linkAdress = data.linkAdress; // Correctly access linkAdress
  }

  ngOnInit(): void {
    // Assuming the data passed to the dialog includes both users and linkAdress
    this.users = this.data.users;
    this.linkAdress = this.data.linkAdress;
    this.filteredSelectedUsers = this.selectedUsers;
    this.filteredSelectedUsers = [...this.selectedUsers];
    this.filteredUsers = [...this.users];

    // Initialize filteredUsers with all users initially
    // New: Fetch all permissions and then filter users

    this.filteredUsers = this.users;
    this.loadInitialData();
  }

  loadInitialData(): void {
    // Fetch the permissions for the report
    this.http
      .get<{ userId: string; linkRowId: string }[]>(
        environment.apiUrl + 'ChameleonOnlineReportsAPI/allPermissions'
      )
      .subscribe(
        (permissions) => {
          this.processPermissionsData(permissions);
        },
        (error) => {
          console.error('Error fetching permissions:', error);
        }
      );
  }

  processPermissionsData(
    permissions: { userId: string; linkRowId: string }[]
  ): void {
    // Determine which users should be in the selectedUsers list
    const usersWithPermission = permissions
      .filter((p) => p.linkRowId === this.linkAdress)
      .map((p) => p.userId);

    // Update selectedUsers and filteredUsers by creating new arrays
    // This helps Angular detect the changes and update the view accordingly.
    this.selectedUsers = this.users.filter((user) =>
      usersWithPermission.includes(user.adUserName)
    );

    console.log(this.selectedUsers); // To check if users are being set correctly
    this.selectedUsersNotToFilter = this.selectedUsers;
    // If you're already calling cdr.detectChanges() after setting selectedUsers and filteredUsers,
    // make sure it's still there. If not, add it to ensure the view updates with the new data.
    this.cdr.detectChanges();
  }

  filterUsers(searchText: string): void {
    if (!searchText) {
      this.filteredUsers = this.users; // If no search text, display all users
    } else {
      searchText = searchText.toLowerCase();
      this.filteredUsers = this.users.filter((user) =>
        user.display.toLowerCase().includes(searchText)
      );
    }
  }

  updateUsers(): void {
    // Remove the parameter
    const apiUrl = environment.apiUrl + 'Users'; // Adjust this to your actual endpoint

    // Use this.linkAdress directly
    const permissions = this.selectedUsers.map((user) => ({
      UserId: user.adUserName,
      LinkRowId: this.linkAdress,
    }));

    // Make the API call
    this.http.post(apiUrl, permissions).subscribe({
      next: (response) => {
        console.log('Permissions successfully updated', response);
        this.dialogRef.close(); // Optionally close the dialog on success
      },
      error: (error) => {
        console.error('Failed to update permissions', error);
      },
    });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
  // New filter method for the destination list
  filterSelectedUsers(searchText: string): void {
    console.log('Filtering with:', searchText); // Debug log
    if (!searchText) {
      this.selectedUsers = this.selectedUsersNotToFilter;
    } else {
      searchText = searchText.toLowerCase();
      this.selectedUsers = this.selectedUsersNotToFilter.filter((user) =>
        user.display.toLowerCase().includes(searchText)
      );
    }
    console.log('Filtered Selected Users:', this.selectedUsers); // Debug log
    this.cdr.detectChanges();
  }
}
