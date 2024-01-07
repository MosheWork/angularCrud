import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

interface FormControls {
  [key: string]: FormControl;
}

@Component({
  selector: 'app-isolation',
  templateUrl: './isolation.component.html',
  styleUrls: ['./isolation.component.scss'],
})
export class IsolationComponent implements OnInit {
  tableTitle: string = 'דוח בידודים';

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  filterForm: FormGroup;
  dataSource: any[] = [];
  filteredData: any[] = [];
  matTableDataSource: MatTableDataSource<any>; // Define MatTableDataSource

  columns: string[] = [
    'id_Num',
    'answer_Text_Type',
    'answer_Text',
    'first_Name',
    'last_Name',
    'enterance_Date',
    'departure_Date',
    'departure_Reason',
    'first_Name_g',
    'last_Name_g',
    'login_Name',
  ];

  getColumnLabel(column: string): string {
    const columnLabels: Record<string, string> = {
      id_Num: 'תעודת זהות',
      answer_Text: 'סיבת בידוד',
      answer_Text_Type: 'סוג בידוד',
      department: 'מחלקה',
      enterance_Date: 'תאריך כניסה לבידוד',
      departure_Date: 'תאריך יציאה מבידוד',
      departure_Reason: 'סיבת יציאה מבידוד',
      first_Name: 'שם פרטי',
      last_Name: 'שם משפחה',
      first_Name_g: 'שם פרטי העובד המתעד',
      last_Name_g: ' שם משפחה העובד המתעד',
      login_Name: 'שם משתמש',
    };
    return columnLabels[column] || column;
  }

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
  }

  ngOnInit() {
    this.http
      .get<any[]>('http://localhost:7144/api/IsolationAPI')
      .subscribe((data) => {
        this.dataSource = data;
        this.filteredData = [...data];
        this.matTableDataSource = new MatTableDataSource(this.filteredData);
        this.matTableDataSource.paginator = this.paginator;
      });

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

    this.filteredData = this.dataSource.filter((item) =>
      this.columns.every((column) => {
        const value = String(item[column]).toLowerCase();
        return !filters[column] || value.includes(filters[column]);
      }) &&
      (globalFilter === '' ||
        this.columns.some((column) => String(item[column]).toLowerCase().includes(globalFilter)))
    );

    this.matTableDataSource.data = this.filteredData;
    this.matTableDataSource.paginator = this.paginator;
  }
}
