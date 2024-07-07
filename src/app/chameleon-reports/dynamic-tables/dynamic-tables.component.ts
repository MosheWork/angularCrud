import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { tap } from 'rxjs/operators';

import * as XLSX from 'xlsx';
import { environment } from '../../../environments/environment';

interface FormControls {
  [key: string]: FormControl;
}

@Component({
  selector: 'app-dynamic-tables',
  templateUrl: './dynamic-tables.component.html',
  styleUrls: ['./dynamic-tables.component.scss']
})
export class DynamicTablesComponent implements OnInit {

  filteredResponsibilities: Observable<string[]> | undefined;
  showGraph: boolean = false;
  Title1: string = ' רשימת טבלאות דינמיות - ';
  Title2: string = 'סה"כ תוצאות ';
  titleUnit: string = 'טבלאות ';
  totalResults: number = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  filterForm: FormGroup;
  graphData!: any[];

  dataSource: any[] = [];
  filteredData: any[] = [];
  answerTextOptions: any[] = [];
  answerTextTypeOptions: any[] = [];

  matTableDataSource: MatTableDataSource<any>;

  columns: string[] = [
    'Code',
    'Description',
    'TableName'
  ];

  parseDate(dateString: string | null): Date | null {
    if (!dateString) {
      return null;
    }

    const parsedDate = new Date(dateString);

    if (isNaN(parsedDate.getTime())) {
      console.warn(`Invalid date string: ${dateString}`);
      return null;
    }

    return parsedDate;
  }

  resetFilters() {
    this.filterForm.reset();
    this.filterForm.get('globalFilter')?.setValue('');
    this.applyFilters();
    this.filteredData = [...this.dataSource];
    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
    this.matTableDataSource.paginator = this.paginator;
  }

  getColumnLabel(column: string): string {
    const columnLabels: Record<string, string> = {
      code: 'קוד',
      description: 'תיאור',
      tableName: 'שם טבלה'
    };
    return columnLabels[column] || column;
  }

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
    this.graphData = [];
  }

  ngOnInit() {
    this.http.get<any[]>(environment.apiUrl + 'DynamicTablesAPI').subscribe(
      (data) => {
        console.log('Data from API:', data);
        this.dataSource = data;
        this.filteredData = [...data];
        this.matTableDataSource = new MatTableDataSource(this.filteredData);
        this.matTableDataSource.paginator = this.paginator;
        this.matTableDataSource.sort = this.sort;
        
        this.columns.forEach((column) => {
          this.filterForm.get(column)?.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => this.applyFilters());
        });
  
        this.fetchAnswerTextOptions();
        this.fetchAnswerTextTypeOptions();
  
        this.filterForm.valueChanges.subscribe(() => {
          this.applyFilters();
          this.paginator.firstPage();
        });
  
        this.applyFilters();
      },
      (error) => {
        console.error('There was an error!', error);
      }
    );
  
    this.filteredResponsibilities = this.getFormControl('departName').valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(value)),
      tap((filteredValues) => console.log('Filtered Values:', filteredValues))
    );
  }
  
  
  
  
  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    const filteredOptions = this.answerTextTypeOptions.filter((option) => option.toLowerCase().includes(filterValue));
    console.log('Filtered Options:', filteredOptions);
    return filteredOptions;
  }

  private createFilterForm() {
    const formControls: FormControls = {};
    this.columns.forEach((column) => {
      formControls[column] = new FormControl('');
    });

    formControls['pageSize'] = new FormControl(10);
    formControls['pageIndex'] = new FormControl(0);
    formControls['globalFilter'] = new FormControl('');

    return this.fb.group(formControls);
  }

  applyFilters() {
    const filters = this.filterForm.value;
    const globalFilter = filters['globalFilter'].toLowerCase();

    this.filteredData = this.dataSource.filter(
      (item) =>
        this.columns.every((column) => {
          const value = String(item[column]).toLowerCase();

          return !filters[column] || value.includes(filters[column]);
        }) &&
        (globalFilter === '' || this.columns.some((column) => String(item[column]).toLowerCase().includes(globalFilter)))
    );

    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
    this.matTableDataSource.paginator = this.paginator;
    this.graphData = this.filteredData;
    console.log(this.graphData);
  }

  exportToExcel() {
    const excelData = this.convertToExcelFormat(this.filteredData);

    const blob = new Blob([excelData], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'filtered_data.xlsx';
    link.click();
  }

  convertToExcelFormat(data: any[]) {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = {
      Sheets: { data: worksheet },
      SheetNames: ['data'],
    };
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    return new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  fetchAnswerTextOptions() {
    this.http.get<any[]>(environment.apiUrl + 'DynamicTablesAPI').subscribe((data) => {
      this.answerTextOptions = [...new Set(data.map((item) => item.Description))];
    });
  }

  fetchAnswerTextTypeOptions() {
    this.http.get<any[]>(environment.apiUrl + 'DynamicTablesAPI').subscribe((data) => {
      this.answerTextTypeOptions = [];
      data.forEach((item: any) => {
        if (this.answerTextTypeOptions.indexOf(item.TableName) < 0 && item.TableName) {
          this.answerTextTypeOptions.push(item.TableName);
        }
      });
      console.log('Table Name Options:', this.answerTextTypeOptions);
    });
  }

  getFormControl(column: string): FormControl {
    return (this.filterForm.get(column) as FormControl) || new FormControl('');
  }

  navigateToGraphPage() {
    this.showGraph = !this.showGraph;
  }

  goToHome() {
    this.router.navigate(['/MainPageReports']);
  }
}
