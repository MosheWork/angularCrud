import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';

import { NewServiceCallComponent } from '../new-service-call/new-service-call.component'; // Adjust the path as necessary


@Component({
  selector: 'app-main-service-calls-screen',
  templateUrl: './main-service-calls-screen.component.html',
  styleUrls: ['./main-service-calls-screen.component.scss']
})
export class MainServiceCallsScreenComponent implements OnInit {

  loginUserName = '';

  serviceItems = [
    {
      pic: '../../../assets/מערכות מידע.png', // Replace with your icon
      title: 'מערכות מידע',
      content: ' ניתן לפתוח בקשת שירות על ציוד מחשובי או יישומים'
    },
    {
      pic: '../../../assets/אחזקה.jpg', // Replace with your icon
      title: 'אחזקה',
      content: 'Some description or content for Maintenance'
    },
    {
      pic: '../../../assets/הנדסה רפואית.png', // Replace with your icon
      title: 'הנדסה רפואית',
      content: 'Some description or content for Medical Engineering'
    }
  ];
  constructor(public dialog: MatDialog,) {}

  openNewServiceCallDialog(): void {
    const dialogRef = this.dialog.open(NewServiceCallComponent, {
      width: '400px',
      // data: { anyDataYouWantToPass: 'example' } // Uncomment and use if you want to pass data to the dialog
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      // Perform actions after dialog is closed, if necessary
    });
  }
  ngOnInit(): void {
    document.title = 'מערכת קריאות';
    this.loginUserName = localStorage.getItem('loginUserName') || '';
  }

}
