import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-permissions-dialog-new',
  templateUrl: './permissions-dialog-new.component.html',
  styleUrls: ['./permissions-dialog-new.component.scss']
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

  

  constructor(
    public dialogRef: MatDialogRef<PermissionsDialogNewComponent>,
    private http: HttpClient,
 
  ) {}

  ngOnInit(): void {
    
      }
    
  

  

  closeDialog(): void {
    this.dialogRef.close();
  }

  
}