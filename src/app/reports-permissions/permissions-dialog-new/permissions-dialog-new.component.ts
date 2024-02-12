import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';

export interface Users {
  employeeID: string;
  firstName: string;
  lastName: string;
  adUserName: string;
  display: string; 
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

  users: Users[]; // Assuming you want to pass an array of Users
  selectedUsers: Users[] = [];


  constructor(
    public dialogRef: MatDialogRef<PermissionsDialogNewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Users[] // Injecting data into the component
  ) {
    this.users = data; // Assign the injected data to your component's property
  }
  ngOnInit(): void {
    
    
  }
  updateUsers(): void {
    // Implement the update logic here
  }
  closeDialog(): void {
    this.dialogRef.close();
  }
}

