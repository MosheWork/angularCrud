import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-main-page-reports',
  templateUrl: './main-page-reports.component.html',
  styleUrls: ['./main-page-reports.component.scss'],
})
export class MainPageReportsComponent implements OnInit {
  cards = [
    {
      title: 'רשימת מכשירים ביחידה-חדש',
      requester: 'משה ממן',
      content: 'פירוט מכשירים פר מחלקה',
      link: '/medicalDevices',
    },
    {
      title: '  רשימת קריאות',
      requester: 'משה ממן',
      content: 'פירוט כל ההקריאות למערכות מידע   ',
      link: '/SysAid',
    },
    // ... more cards
  ];
  moshe = [
    {
      title: 'בדיקה1',
      requester: 'משה ממן',
      content: 'פירוט מכשירים פר מחלקה',
      link: '',
    },
    {
      title: '  רשימת קריאות',
      requester: 'משה ממן',
      content: 'פירוט כל ההקריאות למערכות מידע   ',
      link: '/SysAid',
    },
    // ... more cards
  ];


  constructor() {}

  ngOnInit(): void {}
}
