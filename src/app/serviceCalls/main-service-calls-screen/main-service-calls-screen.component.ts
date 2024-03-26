import { Component, OnInit } from '@angular/core';


@Component({
  selector: 'app-main-service-calls-screen',
  templateUrl: './main-service-calls-screen.component.html',
  styleUrls: ['./main-service-calls-screen.component.scss']
})
export class MainServiceCallsScreenComponent implements OnInit {
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
  constructor() { }

  ngOnInit(): void {
    document.title = 'מערכת קריאות';
  }

}
