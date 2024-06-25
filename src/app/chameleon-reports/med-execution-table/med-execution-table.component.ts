import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import * as XLSX from 'xlsx';

interface MedExecutionModel {
  basic_Name: string;
  drug: number;
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
  styleUrls: ['./med-execution-table.component.scss']
})
export class MedExecutionTableComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'basic_Name', 
    'drug', 
    'exec_Status', 
    'exec_Status_Name', 
    'execution_Date', 
    'category_Name', 
    'execution_UnitName', 
    'admission_No', 
    'generic_Name_ForDisplay'
  ];
  dataSource = new MatTableDataSource<MedExecutionModel>();
  searchValue: string = '';
  titleUnit: string = 'טבלאות ';
  Title1: string = ' רשימת טבלאות דינמיות - ';
  Title2: string = 'סה"כ תוצאות ';
  totalResults: number = 0;
  filterForm: FormGroup;
  showGraph: boolean = false;
  loading: boolean = false;
  showSuccessMessage: boolean = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.filterForm = this.createFilterForm();
  }

  ngOnInit() {
    this.loadData();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  search() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.showSuccessMessage = false;
    const filters = this.filterForm.value;
    let params = new HttpParams();
    if (filters.drug) {
      params = params.append('drug', filters.drug);
    }
    if (filters.startDate) {
      params = params.append('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params = params.append('endDate', filters.endDate);
    }

    this.http.get<MedExecutionModel[]>(`${environment.apiUrl}MedExecutionAPI`, { params })
      .subscribe(data => {
        this.dataSource.data = data;
        this.totalResults = data.length;
        this.loading = false;
        this.showSuccessMessage = true;
        setTimeout(() => {
          this.showSuccessMessage = false;
        }, 5000); // Hide success message after 5 seconds
      }, () => {
        this.loading = false;
      });
  }

  createFilterForm(): FormGroup {
    return this.fb.group({
      drug: [''],
      startDate: [''],
      endDate: [''],
      globalFilter: ['']
    });
  }

  getFormControl(column: string): FormControl {
    return this.filterForm.get(column) as FormControl;
  }

  getColumnLabel(column: string): string {
    const columnLabels: Record<string, string> = {
      basic_Name: 'Basic Name',
      drug: 'Drug',
      exec_Status: 'Exec Status',
      exec_Status_Name: 'Exec Status Name',
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
    this.loadData();
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
}
