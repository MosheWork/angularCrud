import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as XLSX from 'xlsx';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-epidemiological-investigation',
  templateUrl: './epidemiological-investigation.component.html',
  styleUrls: ['./epidemiological-investigation.component.scss'],
})
export class EpidemiologicalInvestigationComponent implements OnInit {
  titleUnit: string = 'חקירה אפידמיולוגית';
  totalResults: number = 0;

  timelineEvents: any[] = [];
  personalDetails: any | null = null;
  employees: any[] = []; // Store employees data
  loadingMainTab: boolean = false; // For the main tab
  loadingTimelineTab: boolean = false; // For the timeline tab
  loadingEmployeeTab: boolean = false; // For the new tab
  columns: string[] = [
    //'MedicalRecord',
    'EntryDate',
    'EntryUserName',
    'Heading',
    'UnitName',
    'Source',
  ];
  employeeColumns: string[] = ['FullName','EmployeeID', 'DepartnentDescripton', 'CellNumber'];

  dataSource: any[] = [];
  filteredData: any[] = [];
  matTableDataSource: MatTableDataSource<any>;
  employeeDataSource: MatTableDataSource<any>;

  detailsForm: FormGroup;
  filterForm: FormGroup;
  idNumControl: FormControl;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
    this.employeeDataSource = new MatTableDataSource<any>([]);
    this.idNumControl = new FormControl('');
    this.detailsForm = this.fb.group({
      FirstName: [''],
      LastName: [''],
      Age: [''],
      GenderText: [''],
      Phone: [''],
      PhoneCell: [''],
      City: [''],
      Street: [''],
      Apartment: [''],
      HouseNo: [''],
    });
  }

  ngOnInit() {
    this.setupFormValueChanges();
  }

  fetchData() {
    const idNum = this.idNumControl.value?.trim();

    if (!idNum) {
      this.snackBar.open('יש להזין מספר מזהה', 'סגור', { duration: 3000 });
      return;
    }

    const investigationUrl = `${environment.apiUrl}EpidemiologicalInvestigation/investigate`;
    const personalDetailsUrl = `${environment.apiUrl}EpidemiologicalInvestigation/personalDetails`;
    const employeesUrl = `${environment.apiUrl}EpidemiologicalInvestigation/employees`;

    this.http.get<any[]>(investigationUrl, { params: { idNum } }).subscribe(
      (data) => {
        this.dataSource = data;
        this.filteredData = [...this.dataSource];
        this.matTableDataSource = new MatTableDataSource(this.filteredData);
        this.matTableDataSource.paginator = this.paginator;
        this.matTableDataSource.sort = this.sort;
        this.applyFilters();
        this.totalResults = this.dataSource.length;
        this.populateTimeline(data);
      },
      (error) => {
        console.error('Error fetching investigation data:', error);
        this.snackBar.open('שגיאה בטעינת נתונים', 'סגור', { duration: 3000 });
      }
    );

    this.http.get<any>(personalDetailsUrl, { params: { idNum } }).subscribe(
      (details) => {
        if (details.length > 0) {
          this.personalDetails = details[0];
          this.detailsForm.patchValue(this.personalDetails);
        } else {
          this.snackBar.open('פרטי משתמש לא נמצאו', 'סגור', { duration: 3000 });
        }
      },
      (error) => {
        console.error('Error fetching personal details:', error);
        this.snackBar.open('שגיאה בטעינת פרטי משתמש', 'סגור', { duration: 3000 });
      }
    );

    this.http.get<any[]>(employeesUrl, { params: { idNum } }).subscribe(
      (data) => {
        this.employees = data;
        this.employeeDataSource = new MatTableDataSource(this.employees);
      },
      (error) => {
        console.error('Error fetching employees data:', error);
        this.snackBar.open('שגיאה בטעינת נתוני עובדים', 'סגור', { duration: 3000 });
      }
    );
  }

  createFilterForm(): FormGroup {
    return this.fb.group({
      globalFilter: [''],
      startDate: [''],
      endDate: [''],
    });
  }

  setupFormValueChanges() {
    this.filterForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.applyFilters();
        this.paginator.firstPage();
      });
  }

  applyFilters() {
    const filters = this.filterForm.value;
    const globalFilter = (filters.globalFilter || '').toLowerCase();
    const startDate = filters.startDate ? new Date(filters.startDate) : null;
    const endDate = filters.endDate ? new Date(filters.endDate) : null;

    this.filteredData = this.dataSource.filter((item) => {
      const globalMatch = this.columns.some((column) => {
        const value = (item[column] || '').toString().toLowerCase();
        return value.includes(globalFilter);
      });

      let dateMatch = true;
      if (startDate || endDate) {
        const entryDate = new Date(item.EntryDate);
        if (startDate && entryDate < startDate) {
          dateMatch = false;
        }
        if (endDate && entryDate > endDate) {
          dateMatch = false;
        }
      }

      return (globalFilter === '' || globalMatch) && dateMatch;
    });

    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
    this.populateTimeline(this.filteredData);
  }

  resetFilters() {
    this.filterForm.reset();
    this.idNumControl.reset();
    this.filteredData = [...this.dataSource];
    this.matTableDataSource.data = this.filteredData;
    this.totalResults = this.filteredData.length;
  }

  exportToExcel() {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filteredData);
    const workbook: XLSX.WorkBook = {
      Sheets: { data: worksheet },
      SheetNames: ['data'],
    };
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    const blob: Blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'epidemiological_investigation.xlsx';
    link.click();
  }

  populateTimeline(filteredData: any[]) {
    this.timelineEvents = filteredData.map((item) => ({
      timestamp: item.EntryDate,
      title: item.EntryUserName,
      UnitName: item.UnitName,
      description: item.Heading || 'No details available',
    }));
  }

  onTabChange(index: number) {
    if (index === 2) {
      console.log('Employees tab selected. Employees:', this.employees);
    }
  }
}
