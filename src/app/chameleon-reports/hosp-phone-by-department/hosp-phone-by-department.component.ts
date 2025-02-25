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
  medUnitOptions: string[] = [];
  nurseUnitOptions: string[] = [];

  columns: string[] = [
    'PatientName',
    'IdNum',
    'Phone',
    'PhoneCell',
    'PhoneWork',
   
    'MedUnit',
    'NurseUnit'
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

        // Populate filter dropdown options
        this.medUnitOptions = [...new Set(data.map(item => item.MedUnit).filter(Boolean))];
        this.nurseUnitOptions = [...new Set(data.map(item => item.NurseUnit).filter(Boolean))];

        this.filterForm.valueChanges.pipe(
          debounceTime(300),
          distinctUntilChanged()
        ).subscribe(() => this.applyFilters());
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
    formControls['medUnitFilter'] = new FormControl([]);
    formControls['nurseUnitFilter'] = new FormControl([]);
    return this.fb.group(formControls);
  }

  applyFilters() {
    const filters = this.filterForm.value;
    const globalFilter = filters['globalFilter'].toLowerCase();
    const selectedMedUnits = filters['medUnitFilter'];
    const selectedNurseUnits = filters['nurseUnitFilter'];
    
    this.filteredData = this.dataSource.filter(item =>
      this.columns.every(column => !filters[column] || String(item[column]).toLowerCase().includes(filters[column].toLowerCase())) &&
      (globalFilter === '' || this.columns.some(column => String(item[column]).toLowerCase().includes(globalFilter))) &&
      (selectedMedUnits.length === 0 || selectedMedUnits.includes(item.MedUnit)) &&
      (selectedNurseUnits.length === 0 || selectedNurseUnits.includes(item.NurseUnit))
    );
    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
  }

  resetFilters() {
    this.filterForm.reset();
    this.filterForm.get('globalFilter')?.setValue('');
    this.filterForm.get('medUnitFilter')?.setValue([]);
    this.filterForm.get('nurseUnitFilter')?.setValue([]);
    this.applyFilters();
  }

  exportToExcel() {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filteredData);
    const workbook: XLSX.WorkBook = { Sheets: { 'Data': worksheet }, SheetNames: ['Data'] };
    XLSX.writeFile(workbook, 'HospPhoneByDepartment.xlsx');
  }
}
