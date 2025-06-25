import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, startWith, tap } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-drug-surgery-report',
  templateUrl: './drug-surgery-report.component.html',
  styleUrls: ['./drug-surgery-report.component.scss'],
})
export class DrugSurgeryReportComponent implements OnInit {
  filteredResponsibilities: Observable<string[]> | undefined;
  showGraph = false;
  Title1 = 'דו״ח תרופות וניתוחים - ';
  Title2 = 'תוצאות סה״כ: ';
  titleUnit = 'מחלקת ניתוחים ';
  totalResults = 0;
  isLoading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  filterForm: FormGroup;
  graphData: any[] = [];
  dataSource: any[] = [];
  filteredData: any[] = [];
  matTableDataSource: MatTableDataSource<any>;

  columns: string[] = [
    'AdmissionNo',
    //'OrderID',
    'Drug',
    'BasicName',
    'DrugGiveTime',
    'OperationStartTime',
    'MinutesDiff',
    //'EntryUser',
    'GiveOrderName',
    'MainDoctor',
    'Anesthetic',
    //'ExecStatusName',
    'ProcedureICD9',
    'ProcedureName',
    'SurgeryDepartment',
    'DrugGivenInOtherUnitsAfterOp',
    'HoursFromOperationToDrug'
  ];
  

  constructor(private http: HttpClient, private fb: FormBuilder, private router: Router) {
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
  }

  ngOnInit() {
    
    this.autoLogin();
    this.http.get<any[]>(environment.apiUrl + 'DrugSurgeryReport').subscribe((data) => {
      this.dataSource = data;
      this.filteredData = [...data];
      this.matTableDataSource = new MatTableDataSource(this.filteredData);
      this.matTableDataSource.paginator = this.paginator;
      this.matTableDataSource.sort = this.sort;

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
      (response: any) => console.log(response),
      (error) => console.error('Error:', error)
    );
  }

  private createFilterForm() {
    const formControls: any = {};
    this.columns.forEach((column) => {
      formControls[column] = new FormControl('');
    });

    formControls['pageSize'] = new FormControl(10);
    formControls['pageIndex'] = new FormControl(0);
    formControls['globalFilter'] = new FormControl('');

    return this.fb.group(formControls);
  }

  getFormControl(column: string): FormControl {
    return (this.filterForm.get(column) as FormControl) || new FormControl('');
  }
  

  getColumnLabel(column: string): string {
    const columnLabels: Record<string, string> = {
      AdmissionNo: 'מספר מקרה',
      OrderID: 'מזהה הזמנה',
      Drug: 'קוד תרופה',
      BasicName: 'שם התרופה',
      DrugGiveTime: 'זמן מתן תרופה',
      OperationStartTime: 'זמן תחילת ניתוח',
      MinutesDiff: 'דקות מהניתוח עד התרופה',
      EntryUser: 'מקודד',
      GiveOrderName: 'נותן התרופה',
      MainDoctor: 'רופא מנתח',
      Anesthetic: 'מרדים',
      ExecStatusName: 'סטטוס מתן',
      ProcedureICD9: 'קוד פרוצדורה',
      ProcedureName: 'שם פרוצדורה',
      SurgeryDepartment: 'מחלקת ניתוח',
      DrugGivenInOtherUnitsAfterOp: 'נרשמה תרופה במחלקה אחרת לאחר ניתוח',
      HoursFromOperationToDrug: 'שעות מהניתוח ועד התרופה'
    };
    return columnLabels[column] || column;
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

  applyFilters() {
    const filters = this.filterForm.value;
    const globalFilter = filters['globalFilter'].toLowerCase();

    this.filteredData = this.dataSource.filter((item) =>
      this.columns.every((column) => {
        const value = String(item[column] || '').toLowerCase();
        return !filters[column] || value.includes(filters[column]);
      }) &&
      (globalFilter === '' ||
        this.columns.some((column) =>
          String(item[column] || '').toLowerCase().includes(globalFilter)
        ))
    );

    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
    this.matTableDataSource.paginator = this.paginator;
    this.graphData = this.filteredData;
  }

  exportToExcel() {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filteredData);
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'drug_surgery_report.xlsx';
    link.click();
  }

  navigateToGraphPage() {
    this.showGraph = !this.showGraph;
  }
  getCellClass(column: string, value: any): string {
    if (column === 'MinutesDiff') {
      const minutes = Number(value);
      if (minutes > 60) return 'minutes-high';
      if (minutes >= 30) return 'minutes-mid';
      if (minutes >= 0) return 'minutes-low';
    }
    return '';
  }
  summary = {
    red: 0,
    orange: 0,
    green: 0,
    total: 0
  };
  
  calculateSummary(data: any[]): void {
    this.summary = {
      red: 0,
      orange: 0,
      green: 0,
      total: data.length
    };
  
    data.forEach(row => {
      const minutes = Number(row.MinutesDiff);
      if (minutes > 60) this.summary.red++;
      else if (minutes >= 30) this.summary.green++;
      else if (minutes >= 0) this.summary.orange++;
    });
  }
  

}
