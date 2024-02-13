import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';

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

    this.filteredUsers = this.users; // Initialize filteredUsers with all users initially
    // New: Fetch all permissions and then filter users
    this.fetchAllPermissions();
  }

  fetchAllPermissions(): void {
    this.http
      .get<{ userId: string; linkRowId: string }[]>(
        'http://localhost:7144/api/ChameleonOnlineReportsAPI/allPermissions'
      )
      .subscribe({
        next: (permissions) => {
          this.filterUsersBasedOnPermissions(permissions);
        },
        error: (error) => {
          console.error('Error fetching permissions:', error);
        },
      });
  }
  filterUsersBasedOnPermissions(
    permissions: { userId: string; linkRowId: string }[]
  ): void {
    // Filter permissions for the current report link
    const permissionsForLink = permissions.filter(
      (p) => p.linkRowId === this.linkAdress
    );

    // Extract UserIds of users with permissions for this linkAdress
    const userIdsWithPermission = permissionsForLink.map((p) => p.userId);

    // Filter users into selectedUsers and filteredUsers based on permissions
    this.selectedUsers = this.users.filter((user) =>
      userIdsWithPermission.includes(user.adUserName)
    );
    this.filteredUsers = this.users.filter(
      (user) => !userIdsWithPermission.includes(user.adUserName)
    );

    // Trigger change detection to update the UI
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
    const apiUrl = 'http://localhost:7144/api/Users'; // Adjust this to your actual endpoint

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
}
