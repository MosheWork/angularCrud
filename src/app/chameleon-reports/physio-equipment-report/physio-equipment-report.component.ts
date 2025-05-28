import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { tap } from 'rxjs/operators';
import * as moment from 'moment';


import * as XLSX from 'xlsx';
import { environment } from '../../../environments/environment';

interface FormControls {
  [key: string]: FormControl;
}

@Component({
  selector: 'app-physio-equipment-report',
  templateUrl: './physio-equipment-report.component.html',
  styleUrls: ['./physio-equipment-report.component.scss'],
})
export class PhysioEquipmentReportComponent implements OnInit {
  filteredResponsibilities: Observable<string[]> | undefined;
  showGraph: boolean = false;
  titleUnit: string = 'דוח ציוד פיזיותרפיה';
  totalResults: number = 0;
  uniqueDepartments: string[] = [];
  data: any[] = []; // This holds all the original data
  filteredData: any[] = []; // This holds filtered data for display
  filters: { [key: string]: any } = {}; // Active filters by column name
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  filterForm: FormGroup;
  graphData!: any[];

  dataSource: any[] = [];


  matTableDataSource: MatTableDataSource<any>;

  columns: string[] = [
    'AdmissionNo',
    'AdmissionDate',
    'ReleaseDate',
    'Department',
  
    'Wheelchair',
    'WheelchairReceiveDate',
    'WheelchairReturned',
    'WheelchairReturnDate',
  
    'Walker',
    'WalkerReceiveDate',
    'WalkerReturned',
    'WalkerReturnDate',
  
    'WalkerArmSupport',
    'WalkerArmSupportReceiveDate',
    'WalkerArmSupportReturned',
    'WalkerArmSupportReturnDate',
  
    'SlideBoard',
    'SlideBoardReceiveDate',
    'SlideBoardReturned',
    'SlideBoardReturnDate',
  
    'TransitionBlocks',
    'TransitionBlocksReceiveDate',
    'TransitionBlocksReturned',
    'TransitionBlocksReturnDate',
  
    'Crutches',
    'CrutchesReceiveDate',
    'CrutchesReturned',
    'CrutchesReturnDate',
  
    'SinglePointCane',
    'SinglePointCaneReceiveDate',
    'SinglePointCaneReturned',
    'SinglePointCaneReturnDate',
  
    'FourPointCane',
    'FourPointCaneReceiveDate',
    'FourPointCaneReturned',
    'FourPointCaneReturnDate',
  
    'Splint',
    'SplintReceiveDate',
    'SplintReturned',
    'SplintReturnDate',
  
    'Pillow',
    'PillowReceiveDate',
    'PillowReturned',
    'PillowReturnDate',
  
    'Other',
    'OtherDescription',
    'OtherReturned',
    'OtherReceiveDate',
    'OtherReturnDate'
  ];
  

  constructor(private http: HttpClient, private fb: FormBuilder, private router: Router) {
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
    this.graphData = [];
  }

  ngOnInit() {
    this.autoLogin();
    this.http.get<any[]>(environment.apiUrl + 'physioEquipmentReport').subscribe((data) => {
      this.dataSource = data;
      
      this.filteredData = [...data];
      this.matTableDataSource = new MatTableDataSource(this.filteredData);
      this.matTableDataSource.paginator = this.paginator;
      this.matTableDataSource.sort = this.sort;
      this.uniqueDepartments = [...new Set(data.map(item => item.Department).filter(d => !!d))];

      this.columns.forEach((column) => {
        this.filterForm.get(column)?.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => this.applyFilters());
      });

      this.filterForm.valueChanges.subscribe(() => {
        this.applyFilters();
        this.paginator.firstPage();
      });

      this.applyFilters();
    });
  }

  autoLogin() {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const url = environment.apiUrl + 'User/current';

    this.http.get(url, { headers, withCredentials: true }).subscribe(
      (response: any) => {
        console.log(response);
      },
      (error) => {
        console.error('Error:', error);
      }
    );
  }

  getColumnLabel(column: string): string {
    const columnLabels: Record<string, string> = {
      AdmissionNo: 'מספר אשפוז',
      AdmissionDate: 'תאריך קבלה',
      ReleaseDate: 'תאריך שחרור',
      Department: 'מחלקה',
  
      Wheelchair: 'כיסא גלגלים',
      WheelchairReceiveDate: 'תאריך קבלת כיסא גלגלים',
      WheelchairReturned: 'הוחזר כיסא גלגלים',
      WheelchairReturnDate: 'תאריך החזרת כיסא גלגלים',
  
      Walker: 'הליכון/רולטור',
      WalkerReceiveDate: 'תאריך קבלת הליכון',
      WalkerReturned: 'הוחזר הליכון',
      WalkerReturnDate: 'תאריך החזרת הליכון',
  
      WalkerArmSupport: 'הליכון אמות',
      WalkerArmSupportReceiveDate: 'תאריך קבלת הליכון אמות',
      WalkerArmSupportReturned: 'הוחזר הליכון אמות',
      WalkerArmSupportReturnDate: 'תאריך החזרת הליכון אמות',
  
      SlideBoard: 'קרש החלקה',
      SlideBoardReceiveDate: 'תאריך קבלת קרש החלקה',
      SlideBoardReturned: 'הוחזר קרש החלקה',
      SlideBoardReturnDate: 'תאריך החזרת קרש החלקה',
  
      TransitionBlocks: 'קוביות למעברים',
      TransitionBlocksReceiveDate: 'תאריך קבלת קוביות',
      TransitionBlocksReturned: 'הוחזרו קוביות',
      TransitionBlocksReturnDate: 'תאריך החזרת קוביות',
  
      Crutches: 'קביים',
      CrutchesReceiveDate: 'תאריך קבלת קביים',
      CrutchesReturned: 'הוחזרו קביים',
      CrutchesReturnDate: 'תאריך החזרת קביים',
  
      SinglePointCane: 'מקל נקודה',
      SinglePointCaneReceiveDate: 'תאריך קבלת מקל נקודה',
      SinglePointCaneReturned: 'הוחזר מקל נקודה',
      SinglePointCaneReturnDate: 'תאריך החזרת מקל נקודה',
  
      FourPointCane: 'מקל 4 נקודות',
      FourPointCaneReceiveDate: 'תאריך קבלת מקל 4 נק׳',
      FourPointCaneReturned: 'הוחזר מקל 4 נק׳',
      FourPointCaneReturnDate: 'תאריך החזרת מקל 4 נק׳',
  
      Splint: 'סד',
      SplintReceiveDate: 'תאריך קבלת סד',
      SplintReturned: 'הוחזר סד',
      SplintReturnDate: 'תאריך החזרת סד',
  
      Pillow: 'כרית',
      PillowReceiveDate: 'תאריך קבלת כרית',
      PillowReturned: 'הוחזרה כרית',
      PillowReturnDate: 'תאריך החזרת כרית',
  
      Other: 'אחר',
      OtherDescription: 'תיאור אחר',
      OtherReturned: 'הוחזר אחר',
      OtherReceiveDate: 'תאריך קבלת אחר',
      OtherReturnDate: 'תאריך החזרת אחר'
    };
  
    return columnLabels[column] || column;
  }
  isDateColumn(column: string): boolean {
    const dateColumns = [
      'AdmissionDate', 'ReleaseDate',
      'WheelchairReceiveDate', 'WheelchairReturnDate',
      'WalkerReceiveDate', 'WalkerReturnDate',
      'WalkerArmSupportReceiveDate', 'WalkerArmSupportReturnDate',
      'SlideBoardReceiveDate', 'SlideBoardReturnDate',
      'TransitionBlocksReceiveDate', 'TransitionBlocksReturnDate',
      'CrutchesReceiveDate', 'CrutchesReturnDate',
      'SinglePointCaneReceiveDate', 'SinglePointCaneReturnDate',
      'FourPointCaneReceiveDate', 'FourPointCaneReturnDate',
      'SplintReceiveDate', 'SplintReturnDate',
      'PillowReceiveDate', 'PillowReturnDate',
      'OtherReceiveDate', 'OtherReturnDate'
    ];
    return dateColumns.includes(column);
  }
  
  private createFilterForm() {
    const formControls: FormControls = {};
    this.columns.forEach((column) => {
      formControls[column] = new FormControl('');
      formControls['AdmissionDateFrom'] = new FormControl('');
formControls['AdmissionDateTo'] = new FormControl('');
    });
    return this.fb.group(formControls);
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
  
    const from = filters['AdmissionDateFrom'] ? moment(filters['AdmissionDateFrom']).startOf('day') : null;
    const to = filters['AdmissionDateTo'] ? moment(filters['AdmissionDateTo']).endOf('day') : null;
  
    this.filteredData = this.dataSource.filter(row => {
      // AdmissionDate range filter
      if (from || to) {
        const rowDate = moment(row['AdmissionDate']);
        if ((from && rowDate.isBefore(from)) || (to && rowDate.isAfter(to))) {
          return false;
        }
      }
  
      // Other column filters
      return this.columns.every(column => {
        const filterVal = filters[column];
        const rowVal = row[column];
  
        // Skip if no filter applied
        if (!filterVal) return true;
  
        // Date filters (except AdmissionDate which is handled above)
        if (column.toLowerCase().includes('date')) {
          const rowDate = moment(rowVal);
          const filterDate = moment(filterVal);
          return rowDate.isSame(filterDate, 'day');
        }
  
        // Text match
        return rowVal?.toString().toLowerCase().includes(filterVal.toString().toLowerCase());
      });
    });
  
    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
    console.log('✅ Filtered data:', this.filteredData);
  }
  
  

  
  
  exportToExcel() {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filteredData);
    const workbook: XLSX.WorkBook = {
      Sheets: { data: worksheet },
      SheetNames: ['data'],
    };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'physio_equipment_data.xlsx';
    link.click();
  }

  getFormControl(column: string): FormControl {
    return (this.filterForm.get(column) as FormControl) || new FormControl('');
  }

  goToHome() {
    this.router.navigate(['/MainPageReports']);
  }

  resetFilters() {
    this.filterForm.reset();
  }

  navigateToGraphPage() {
    this.router.navigate(['/PhysioEquipmentGraph']);
  }

  Title1: string = ' — סה"כ רשומות: ';
  Title2: string = '';

  isDate(value: any): boolean {
    return value instanceof Date || (!isNaN(Date.parse(value)) && typeof value === 'string');
  }
  displayDate(date: any): string {
    if (!date || date === '1970-01-01T00:00:00' || new Date(date).getFullYear() === 1970) {
      return '';
    }
  
    const parsedDate = new Date(date);
    const day = parsedDate.getDate().toString().padStart(2, '0');
    const month = (parsedDate.getMonth() + 1).toString().padStart(2, '0');
    const year = parsedDate.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
}
