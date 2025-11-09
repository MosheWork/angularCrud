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
  selector: 'app-components-list-in-units',
  templateUrl: './components-list-in-units.component.html',
  styleUrls: ['./components-list-in-units.component.scss']
})
export class ComponentsListInUnitsComponent implements OnInit {

  filteredResponsibilities: Observable<string[]> | undefined;
  showGraph: boolean = false;
  Title1: string = ' רשימת רכיבים ביחידות - ';
  Title2: string = 'סה"כ תוצאות ';
  titleUnit: string = 'רכיבים ';
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
    //'row_id',
    'unit',
    'heading',
    'name',
    'record_Name',
    'answer_Text',
    'folder',
    'field',
    'screen'
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
      //row_id: 'קוד שורה',
      unit: 'קוד יחידה',
      name: 'שם יחידה',
      heading: 'שם הרכיב ',
      record_Name: 'גיליון ',
      answer_Text: ' חוצץ',
      folder: 'תיקייה',
      field: 'שדה',
      screen: 'מסך'
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
    this.http.get<any[]>(environment.apiUrl + 'ComponentsListInUnitsAPI').subscribe((data) => {
      // 🔁 Normalize keys (API → component keys)
      const normalized = data.map(d => ({
        row_id:       d.row_id ?? d.Row_id ?? d.Row_ID ?? null,
        unit:         d.unit   ?? d.Unit   ?? null,
        heading:      d.heading?? d.Heading?? '',
        name:         d.name   ?? d.Name   ?? '',
        record_Name:  d.record_Name ?? d.Record_Name ?? '',
        answer_Text:  d.answer_Text ?? d.Answer_Text ?? '',
  
        // ⬇️ NEW: cast numeric smallint to string for display/filter
        folder:       (d.folder ?? d.Folder ?? '')?.toString(),
        field:        (d.field  ?? d.Field  ?? '')?.toString(),
        screen:       (d.screen ?? d.Screen ?? '')?.toString()
      }));
  
      this.dataSource = normalized;
      this.filteredData = [...normalized];
      this.matTableDataSource = new MatTableDataSource(this.filteredData);
      this.matTableDataSource.paginator = this.paginator;
      this.matTableDataSource.sort = this.sort;
  
      this.columns.forEach((column) => {
        this.filterForm.get(column)?.valueChanges
          .pipe(debounceTime(300), distinctUntilChanged())
          .subscribe(() => this.applyFilters());
      });
  
      this.fetchAnswerTextOptions();      // now reads from normalized keys
      this.fetchAnswerTextTypeOptions();  // now reads from normalized keys
  
      this.filterForm.valueChanges.subscribe(() => {
        this.applyFilters();
        this.paginator.firstPage();
      });
  
      this.applyFilters();
    });
  
    // ... rest unchanged
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
    this.http.get<any[]>(environment.apiUrl + 'ComponentsListInUnitsAPI').subscribe((data) => {
      const normalized = data.map(d => ({
        answer_Text: d.answer_Text ?? d.Answer_Text ?? '',
      }));
      this.answerTextOptions = [...new Set(normalized.map(x => x.answer_Text))];
    });
  }
  
  fetchAnswerTextTypeOptions() {
    this.http.get<any[]>(environment.apiUrl + 'ComponentsListInUnitsAPI').subscribe((data) => {
      const normalized = data.map(d => ({
        record_Name: d.record_Name ?? d.Record_Name ?? '',
      }));
      this.answerTextTypeOptions = [];
      normalized.forEach((x) => {
        if (x.record_Name && this.answerTextTypeOptions.indexOf(x.record_Name) < 0) {
          this.answerTextTypeOptions.push(x.record_Name);
        }
      });
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
