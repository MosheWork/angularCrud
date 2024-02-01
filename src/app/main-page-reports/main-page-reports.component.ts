import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router'; // Import the Router

@Component({
  selector: 'app-main-page-reports',
  templateUrl: './main-page-reports.component.html',
  styleUrls: ['./main-page-reports.component.scss'],
})
export class MainPageReportsComponent implements OnInit {
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  matTableDataSource: MatTableDataSource<any>; // Define MatTableDataSource

  columns: string[] = [
    'unit',
    'name',
    'dongle_Id',
    'dongle_Description',
    'timeOut_Minutes',
  ];
    // Example data array
    ELEMENT_DATA: any[] = [
      { unit: 'מחלקה 1', name: 'סוג מכשיר 1', dongle_Id: '123', dongle_Description: 'תיאור מכשיר 1', timeOut_Minutes: '30' },
      { unit: 'מחלקה 2', name: 'סוג מכשיר 2', dongle_Id: '456', dongle_Description: 'תיאור מכשיר 2', timeOut_Minutes: '45' },
      // ... more rows
    ];
  
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
  getColumnLabel(column: string): string {
    const columnLabels: Record<string, string> = {
      name: 'סוג מכשיר',
      unit: ' מחלקה ',
      dongle_Id: 'מזהה ייחודי',
      dongle_Description: 'שם מכשיר ביחידה',
      timeOut_Minutes: ' מספר דקות לניתוק אוטומטי',
    
    };
    return columnLabels[column] || column;
  }

  constructor() {
    this.matTableDataSource = new MatTableDataSource<any>([]);
  }

  ngOnInit(): void {}
}
