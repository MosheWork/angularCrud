import { Component, OnInit, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import * as XLSX from 'xlsx';

interface MedExecutionModel {
  basic_Name: string;
  drug: string;
  exec_Status: number;
  exec_Status_Name: string;
  execution_Date: Date;
  category_Name: string;
  execution_UnitName: string;
  admission_No: string;
  generic_Name_ForDisplay: string;
  dosage_InOrder: number;
  dosage_Unit_InOrder: string;
  way_Of_Giving: string;
  id_Num: string;
  full_Name: string;
  depart_Name: string; // New field
}

@Component({
  selector: 'app-med-execution-table',
  templateUrl: './med-execution-table.component.html',
  styleUrls: ['./med-execution-table.component.scss'],
  providers: [DatePipe]
})
export class MedExecutionTableComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'Basic_Name', 
    'Drug', 
    'Execution_Date', 
    'Category_Name', 
    'Execution_UnitName', 
    'Generic_Name_ForDisplay',
    'Dosage_InOrder',
    'Dosage_Unit_InOrder',
    'Way_Of_Giving',
    'Id_Num',
    'Full_Name',
    'Depart_Name' // New column
  ];

  dataSource = new MatTableDataSource<MedExecutionModel>();
  searchValue: string = '';
  titleUnit: string = 'מעבדות ';
  Title1: string = '   דוח תרופות - ';
  Title2: string = 'סה"כ תוצאות ';
  totalResults: number = 0;
  filterForm: FormGroup;
  showGraph: boolean = false;
  loading: boolean = false;
  showSuccessMessage: boolean = false;
  showMessage: boolean = false;
  basicNameOptions: string[] = [];
  genericNameOptions: string[] = [];
  unitNameOptions: string[] = [];
  filteredBasicNameOptions!: Observable<string[]>;
  filteredGenericNameOptions!: Observable<string[]>;
  filteredUnitNameOptions!: Observable<string[]>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  basicNamesControl = new FormControl('');
  genericNamesControl = new FormControl('');
  unitNamesControl = new FormControl('');

  constructor(private http: HttpClient, private fb: FormBuilder, private datePipe: DatePipe) {
    this.filterForm = this.createFilterForm();
  }

  ngOnInit() {
    this.fetchBasicNameOptions();
    this.fetchGenericNameOptions();
    this.fetchUnitNameOptions();

    this.filteredBasicNameOptions = this.basicNamesControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterBasicNameOptions(value || ''))
    );
    this.filteredGenericNameOptions = this.genericNamesControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterGenericNameOptions(value || ''))
    );
    this.filteredUnitNameOptions = this.unitNamesControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterUnitNameOptions(value || ''))
    );
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  fetchBasicNameOptions() {
    this.http.get<string[]>(`${environment.apiUrl}MedExecutionAPI/GetBasicNameOptions`).subscribe(
      data => {
        this.basicNameOptions = data;
      },
      error => {
        console.error('Error fetching basic name options:', error);
      }
    );
  }

  fetchGenericNameOptions() {
    this.http.get<string[]>(`${environment.apiUrl}MedExecutionAPI/GetGenericNameOptions`).subscribe(
      data => {
        this.genericNameOptions = data;
      },
      error => {
        console.error('Error fetching generic name options:', error);
      }
    );
  }

  fetchUnitNameOptions() {
    this.http.get<string[]>(`${environment.apiUrl}MedExecutionAPI/GetUnitNameOptions`).subscribe(
      data => {
        this.unitNameOptions = data;
      },
      error => {
        console.error('Error fetching unit name options:', error);
      }
    );
  }

  private _filterBasicNameOptions(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.basicNameOptions.filter(option => option.toLowerCase().includes(filterValue));
  }

  private _filterGenericNameOptions(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.genericNameOptions.filter(option => option.toLowerCase().includes(filterValue));
  }

  private _filterUnitNameOptions(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.unitNameOptions.filter(option => option.toLowerCase().includes(filterValue));
  }

  displayBasicName(basicName: string): string {
    return basicName;
  }

  displayGenericName(genericName: string): string {
    return genericName;
  }

  displayUnitName(unitName: string): string {
    return unitName;
  }

  search() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.showSuccessMessage = false;
    const filters = this.filterForm.value;
    let params = new HttpParams();

    if (this.basicNamesControl.value) {
      params = params.append('Basic_Names', this.basicNamesControl.value);
    }

    if (filters.drug) {
      params = params.append('Drug', filters.drug);
    }

    if (filters.execution_Date) {
      const formattedExecutionDate = this.datePipe.transform(filters.execution_Date, 'yyyy-MM-dd');
      params = params.append('Execution_Date', formattedExecutionDate!);
    }

    if (filters.category_Name) {
      params = params.append('Category_Name', filters.category_Name);
    }

    if (this.unitNamesControl.value) {
      params = params.append('Execution_UnitNames', this.unitNamesControl.value);
    }

    if (filters.admission_No) {
      params = params.append('Admission_No', filters.admission_No);
    }

    if (this.genericNamesControl.value) {
      params = params.append('Generic_Names_ForDisplay', this.genericNamesControl.value);
    }

    if (filters.startDate) {
      const formattedStartDate = this.datePipe.transform(filters.startDate, 'yyyy-MM-dd');
      params = params.append('StartDate', formattedStartDate!);
    }

    if (filters.endDate) {
      const formattedEndDate = this.datePipe.transform(filters.endDate, 'yyyy-MM-dd');
      params = params.append('EndDate', formattedEndDate!);
    }

    this.http.get<MedExecutionModel[]>(`${environment.apiUrl}MedExecutionAPI`, { params })
      .subscribe(data => {
        this.dataSource.data = data;
        this.totalResults = data.length;
        this.loading = false;
        this.showSuccessMessage = true;
        setTimeout(() => {
          this.showSuccessMessage = false;
        }, 5000);
      }, () => {
        this.loading = false;
      });
  }

  createFilterForm(): FormGroup {
    return this.fb.group({
      basic_Names: this.basicNamesControl,
      drug: new FormControl(''),
      execution_Date: new FormControl(''),
      category_Name: new FormControl(''),
      execution_UnitNames: this.unitNamesControl,
      admission_No: new FormControl(''),
      generic_Names_ForDisplay: this.genericNamesControl,
      startDate: new FormControl(''),
      endDate: new FormControl('')
    });
  }

  getFormControl(column: string): FormControl {
    return this.filterForm.get(column) as FormControl;
  }

  getColumnLabel(column: string): string {
    const columnLabels: Record<string, string> = {
      basic_Name: 'Basic Name',
      drug: 'Drug',
      execution_Date: 'Execution Date',
      category_Name: 'Category Name',
      execution_UnitName: 'Execution Unit Name',
      admission_No: 'Admission No',
      generic_Name_ForDisplay: 'Generic Name'
    };
    return columnLabels[column] || column;
  }

  resetFilters() {
    this.filterForm.reset();
    this.filterForm.get('globalFilter')?.setValue('');
  }

  exportToExcel() {
    const data = this.dataSource.data.map(item => {
      const record: any = {};
      this.displayedColumns.forEach(column => record[column] = item[column as keyof MedExecutionModel]);
      return record;
    });
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = {
      Sheets: { data: worksheet },
      SheetNames: ['data'],
    };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'MedExecutionData.xlsx';
    link.click();
  }

  navigateToGraphPage() {
    this.showGraph = !this.showGraph;
  }

  goToHome() {
    // Implement navigation to the home page
  }

  applyFilter(event: Event, column: string) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.filterForm.get(column)?.setValue(filterValue.trim().toLowerCase());
  }

  @HostListener('mouseenter', ['$event'])
  onMouseEnter() {
    this.showMessage = true;
  }

  @HostListener('mouseleave', ['$event'])
  onMouseLeave() {
    this.showMessage = false;
  }
}
