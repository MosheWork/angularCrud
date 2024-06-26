import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
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
}

@Component({
  selector: 'app-med-execution-table',
  templateUrl: './med-execution-table.component.html',
  styleUrls: ['./med-execution-table.component.scss'],
  providers: [DatePipe]
})
export class MedExecutionTableComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'basic_Name', 
    'drug', 
    'execution_Date', 
    'category_Name', 
    'execution_UnitName', 
    'admission_No', 
    'generic_Name_ForDisplay'
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
  basicNameOptions: string[] = [];





  filteredBasicNameOptions!: Observable<string[]>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private fb: FormBuilder, private datePipe: DatePipe) {
    this.filterForm = this.createFilterForm();
  }

  ngOnInit() {
    this.fetchBasicNameOptions();
    this.filteredBasicNameOptions = this.filterForm.controls['basic_Name'].valueChanges.pipe(
      startWith(''),
      map(value => this._filterBasicNameOptions(value))
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
  

  private _filterBasicNameOptions(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.basicNameOptions.filter(option => option.toLowerCase().includes(filterValue));
  }

  search() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.showSuccessMessage = false;
    const filters = this.filterForm.value;
    let params = new HttpParams();
    if (filters.basic_Name) {
      params = params.append('basic_Name', filters.basic_Name);
    }
    if (filters.drug) {
      params = params.append('drug', filters.drug);
    }
    if (filters.execution_Date) {
      const formattedExecutionDate = this.datePipe.transform(filters.execution_Date, 'yyyy-MM-dd');
      params = params.append('execution_Date', formattedExecutionDate!);
    }
    if (filters.category_Name) {
      params = params.append('category_Name', filters.category_Name);
    }
    if (filters.execution_UnitName) {
      params = params.append('execution_UnitName', filters.execution_UnitName);
    }
    if (filters.admission_No) {
      params = params.append('admission_No', filters.admission_No);
    }
    if (filters.generic_Name_ForDisplay) {
      params = params.append('generic_Name_ForDisplay', filters.generic_Name_ForDisplay);
    }
    if (filters.startDate) {
      const formattedStartDate = this.datePipe.transform(filters.startDate, 'yyyy-MM-dd');
      params = params.append('startDate', formattedStartDate!);
    }
    if (filters.endDate) {
      const formattedEndDate = this.datePipe.transform(filters.endDate, 'yyyy-MM-dd');
      params = params.append('endDate', formattedEndDate!);
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
      basic_Name: new FormControl(''),
      drug: new FormControl(''),
      execution_Date: new FormControl(''),
      category_Name: new FormControl(''),
      execution_UnitName: new FormControl(''),
      admission_No: new FormControl(''),
      generic_Name_ForDisplay: new FormControl(''),
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
}
