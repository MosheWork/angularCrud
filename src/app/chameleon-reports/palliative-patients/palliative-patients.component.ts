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

import * as XLSX from 'xlsx';
import { environment } from '../../../environments/environment';

interface FormControls {
  [key: string]: FormControl;
}

@Component({
  selector: 'app-palliative-patients-table',
  templateUrl: './palliative-patients.component.html',
  styleUrls: ['./palliative-patients.component.scss'],
})
export class PalliativePatientsComponent implements OnInit {
  filteredResponsibilities: Observable<string[]> | undefined;
  showGraph: boolean = false;
  Title1: string = 'Palliative Care - Patient Report - ';
  Title2: string = 'Total Results: ';
  titleUnit: string = 'Palliative Care ';
  totalResults: number = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  filterForm: FormGroup;
  graphData!: any[];

  dataSource: any[] = [];
  filteredData: any[] = [];

  matTableDataSource: MatTableDataSource<any>;

  columns: string[] = [
    'FirstName',
    'LastName',
    'IdNum',
    'EntryDate',
    'ResultComboText',
    'SystemUnitName',
    'FieldRadioButton3Text',
    'FieldTextArea1',
  ];

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
      FirstName: 'שם פרטי',
      lastName: 'שם משפחה',
      IdNum: 'תעודת זהות',
      EntryDate: 'תאריך עדכון',
      ResultComboText: 'הגדרת חולה ',
      SystemUnitName: 'יחידה',
      FieldRadioButton3Text: 'הנחיות מוקדמות',
      FieldTextArea1: 'פירוט הנחיות מוקדמות',
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
    this.autoLogin();
    this.http
      .get<any[]>(environment.apiUrl + 'palliativePatients')
      .subscribe((data) => {
        this.dataSource = data;
        this.filteredData = [...data];
        this.matTableDataSource = new MatTableDataSource(this.filteredData);
        this.matTableDataSource.paginator = this.paginator;
        this.matTableDataSource.sort = this.sort;

        this.columns.forEach((column) => {
          this.filterForm
            .get(column)
            ?.valueChanges.pipe(debounceTime(300), distinctUntilChanged())
            .subscribe(() => this.applyFilters());
        });

        this.filterForm.valueChanges.subscribe(() => {
          this.applyFilters();
          this.paginator.firstPage();
        });

        this.applyFilters();
      });

    this.filteredResponsibilities = this.getFormControl(
      'field_radio_button3_text'
    ).valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(value)),
      tap((filteredValues) => console.log('Filtered Values:', filteredValues))
    );
  }

  autoLogin() {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const url = environment.apiUrl + 'User/current';

    this.http.get(url, { headers, withCredentials: true }).subscribe(
      (response: any) => {
        let user_details = response;
        console.log(response);
      },
      (error) => {
        console.error('Error:', error);
      }
    );
  }
  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    const filteredOptions = this.filteredData.filter((option) =>
      option.field_radio_button3_text.toLowerCase().includes(filterValue)
    );
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
        (globalFilter === '' ||
          this.columns.some((column) =>
            String(item[column]).toLowerCase().includes(globalFilter)
          ))
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
    link.download = 'palliative_patients_data.xlsx';
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
