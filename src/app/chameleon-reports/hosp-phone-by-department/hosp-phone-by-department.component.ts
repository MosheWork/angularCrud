import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { environment } from '../../../environments/environment';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-hosp-phone-by-department',
  templateUrl: './hosp-phone-by-department.component.html',
  styleUrls: ['./hosp-phone-by-department.component.scss']
})
export class HospPhoneByDepartmentComponent implements OnInit {

  title: string = 'טלפונים של מטופלים - מאושפזים';
  totalResults: number = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  filterForm: FormGroup;
  dataSource: any[] = [];
  filteredData: any[] = [];
  matTableDataSource: MatTableDataSource<any>;
  UnitOptions: string[] = [];

  // 🔑 lower-first keys expected from backend
  columns: string[] = [
    'admission_No',
    'unitName',
    'patientName',
    'idNum',
    'phone',
    'phoneCell',
    'phoneWork'
  ];

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
  }

  ngOnInit() {
    this.http.get<any[]>(environment.apiUrl + 'HospPhoneByDepartment').subscribe(
      (data) => {
        this.dataSource = data;
        this.filteredData = [...data];
        this.matTableDataSource = new MatTableDataSource(this.filteredData);
        this.matTableDataSource.paginator = this.paginator;
        this.matTableDataSource.sort = this.sort;

        // Populate Unit filter dropdown options
        this.UnitOptions = [...new Set(data.map(item => item.unitName).filter(Boolean))];

        this.filterForm.valueChanges
          .pipe(debounceTime(300), distinctUntilChanged())
          .subscribe(() => this.applyFilters());
      },
      (error) => {
        console.error('Error fetching data:', error);
      }
    );
  }

  private createFilterForm() {
    const formControls: { [key: string]: FormControl } = {};
    this.columns.forEach((column) => {
      formControls[column] = new FormControl('');
    });
    formControls['globalFilter'] = new FormControl('');
    formControls['UnitFilter'] = new FormControl<string[]>([]);
    return this.fb.group(formControls);
  }

  applyFilters() {
    const filters = this.filterForm.value;
    const globalFilter = (filters['globalFilter'] || '').toLowerCase();
    const selectedMedUnits: string[] = filters['UnitFilter'] || [];

    this.filteredData = this.dataSource.filter(item =>
      // per-column filters
      this.columns.every(column =>
        !filters[column] || String(item[column] ?? '').toLowerCase().includes(String(filters[column]).toLowerCase())
      )
      // global filter
      && (
        globalFilter === '' ||
        this.columns.some(column => String(item[column] ?? '').toLowerCase().includes(globalFilter))
      )
      // unit filter
      && (selectedMedUnits.length === 0 || selectedMedUnits.includes(item.unitName))
    );

    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
  }

  resetFilters() {
    this.filterForm.reset();
    this.filterForm.get('globalFilter')?.setValue('');
    this.filterForm.get('UnitFilter')?.setValue([]);
    this.applyFilters();
  }

  exportToExcel() {
    const dataForExport = this.filteredData.map(item => ({
      'מספר מקרה': item.admission_No,
      'מחלקה': item.unitName,
      'שם מטופל': item.patientName,
      'תעודת זהות': item.idNum,
      'טלפון בית': item.phone,
      'טלפון נייד': item.phoneCell,
      'טלפון עבודה': item.phoneWork
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataForExport);
    const workbook: XLSX.WorkBook = { Sheets: { 'נתונים': worksheet }, SheetNames: ['נתונים'] };

    XLSX.writeFile(workbook, 'HospPhoneByDepartment.xlsx');
  }

}
