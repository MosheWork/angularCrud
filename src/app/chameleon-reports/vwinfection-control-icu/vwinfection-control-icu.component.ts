import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';

import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-vw-infection-control-icu',
  templateUrl: './vwinfection-control-icu.component.html',
  styleUrls: ['./vwinfection-control-icu.component.scss']
})
export class VWInfectionControlICUComponent implements OnInit {
  totalResults: number = 0;
  titleUnit: string = 'דוח זיהומים טיפול נמרץ';
  Title1: string = ' סה"כ תוצאות: ';
  Title2: string = '';

   // Define the columns and their friendly headers
   columns: string[] = [
    'PersonalID',
    'PersonalFirstName',
    'PersonalLastName',
    'תאריךמילוי',
    'אבחוןשלVAP',
    'תאריךאבחון',
    'מספרמיטה',
    'יומןשמה',
    'כיח',
    'טיפולאנטיביוטי',
    'WBC',
    'חום',
    'FIO2',
    'PEEP',
    'דרךסוגהנשמה',
    'לקיחתכיחלתרבית',
    'מניעהשלVAP',
    'טיפוללב',
    'פיזיוטרפיהנשימתית',
    'השכבה30מעלות',
    'הפסקתסדציה',
    'בדיקתאפשרותלאקסטובציה',
    'אבחוןCLABSI',
    'תאריךהכנסתצנתר1',
    'מיקוםצנתר1',
    'תאריךהוצאתצנתר1',
    'תאריךהכנסתצנתר2',
    'מיקוםצנתר2',
    'תאריךהוצאתצנתר2',
    'מניעתCLABSI',
    'סימניזיהום',
    'החלפתחבישה',
    'חבישהעםכלורהקסידין',
    'רחצהיבשה',
    'שימושבNEEDLESS',
    'קיימתנחיצותלצנתר1',
    'קיימתנחיצותלצנתר2',
    'מעקבאחרייפצעניתוח',
    'בדיקתפצעבהחלפתחבישהתקין',
    'סוגהפרשהוכמות',
    'צמיחהתרביתמהפצע',
    'התחלתטיפולאנטיביוטיטיפולי',
    'התחלתטיפולאנטיביוטיוסוג',
  ];

  columnHeaders: { [key: string]: string } = {
    PersonalID: 'תעודת זהות',
    PersonalFirstName: 'שם פרטי',
    PersonalLastName: 'שם משפחה',
    תאריךמילוי: 'תאריך מילוי',
    אבחוןשלVAP: 'אבחון של VAP',
    תאריךאבחון: 'תאריך אבחון',
    מספרמיטה: 'מספר מיטה',
    יומןשמה: 'יום הנשמה',
    כיח: 'כיח',
    טיפולאנטיביוטי: 'טיפול אנטיביוטי',
    WBC: 'WBC',
    חום: 'חום',
    FIO2: 'FIO2',
    PEEP: 'PEEP',
    דרךסוגהנשמה: 'דרך / סוג הנשמה',
    לקיחתכיחלתרבית: 'לקיחת כיח לתרבית',
    מניעהשלVAP: 'מניעה של VAP',
    טיפוללב: 'טיפול לב',
    פיזיוטרפיהנשימתית: 'פיזיותרפיה נשימתית',
    השכבה30מעלות: 'השכבה 30 מעלות',
    הפסקתסדציה: 'הפסקת סדציה',
    בדיקתאפשרותלאקסטובציה: 'בדיקת אפשרות לאקסטובציה',
    אבחוןCLABSI: 'אבחון CLABSI',
    תאריךהכנסתצנתר1: 'ת. הכנסת צנתר 1',
    מיקוםצנתר1: 'מיקום צנתר 1',
    תאריךהוצאתצנתר1: 'ת. הוצאת צנתר 1',
    תאריךהכנסתצנתר2: 'ת. הכנסת צנתר 2',
    מיקוםצנתר2: 'מיקום צנתר 2',
    תאריךהוצאתצנתר2: 'ת. הוצאת צנתר 2',
    מניעתCLABSI: 'מניעת CLABSI',
    סימניזיהום: 'סימני זיהום',
    החלפתחבישה: 'החלפת חבישה',
    חבישהעםכלורהקסידין: 'חבישה עם כלורהקסידין',
    רחצהיבשה: 'רחצה יבשה',
    שימושבNEEDLESS: 'שימוש ב NEEDLESS',
    קיימתנחיצותלצנתר1: 'קיימת נחיצות לצנתר 1',
    קיימתנחיצותלצנתר2: 'קיימת נחיצות לצנתר 2',
    מעקבאחרייפצעניתוח: 'מעקב אחרי פצע ניתוח',
    בדיקתפצעבהחלפתחבישהתקין: 'בדיקת פצע בהחלפת חבישה תקין',
    סוגהפרשהוכמות: 'סוג הפרשה וכמות',
    צמיחהתרביתמהפצע: 'צמיחה תרבית מהפצע',
    התחלתטיפולאנטיביוטיטיפולי: 'התחלת טיפול אנטיביוטי טיפולי',
    התחלתטיפולאנטיביוטיוסוג: 'התחלת טיפול אנטיביוטי וסוג',
  };

  

  dataSource: any[] = [];
  filteredData: any[] = [];
  matTableDataSource: MatTableDataSource<any>;

  filterForm: FormGroup;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private fb: FormBuilder, private router: Router) {
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
  }

  ngOnInit() {
    this.http.get<any[]>(environment.apiUrl + 'VWInfectionControlICU').subscribe((data) => {
      this.dataSource = data;
      this.filteredData = [...data];
      this.matTableDataSource = new MatTableDataSource(this.filteredData);
      this.matTableDataSource.paginator = this.paginator;
      this.matTableDataSource.sort = this.sort;

      // Add value changes listener to all form controls
      this.columns.forEach((column) => {
        this.filterForm.get(column)?.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => this.applyFilters());
      });

      // Global filter value change listener
      this.filterForm.valueChanges.subscribe(() => {
        this.applyFilters();
        this.paginator.firstPage(); // Reset to first page after filtering
      });

      // Initial filter application
      this.applyFilters();
    });
  }

  private createFilterForm(): FormGroup {
    const formControls: any = {};
    this.columns.forEach((column) => {
      formControls[column] = new FormControl('');
    });
    formControls['globalFilter'] = new FormControl('');
    return this.fb.group(formControls);
  }

  applyFilters() {
    const filters = this.filterForm.value;
    const globalFilter = (filters['globalFilter'] || '').toLowerCase();

    this.filteredData = this.dataSource.filter((item) =>
      this.columns.every((column) => {
        const value = item[column];
        const filterValue = filters[column];

        const stringValue = typeof value === 'string' ? value.toLowerCase() : String(value).toLowerCase();
        const filterString = typeof filterValue === 'string' ? filterValue.toLowerCase() : filterValue;

        return (!filterString || stringValue.includes(filterString)) &&
               (!globalFilter || this.columns.some((col) => String(item[col]).toLowerCase().includes(globalFilter)));
      })
    );

    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
    this.matTableDataSource.paginator = this.paginator;
  }

  resetFilters() {
    this.filterForm.reset();
    this.filterForm.get('globalFilter')?.setValue('');
    this.applyFilters();
  }

  exportToExcel() {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filteredData);
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'vw_infection_control_icu.xlsx';
    link.click();
  }
}
