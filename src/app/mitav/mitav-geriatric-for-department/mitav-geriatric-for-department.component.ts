import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { environment } from '../../../environments/environment';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-mitav-geriatric-for-department',
  templateUrl: './mitav-geriatric-for-department.component.html',
  styleUrls: ['./mitav-geriatric-for-department.component.scss'],
})
export class MitavGeriatricForDepartmentComponent implements OnInit {
  title: string = 'דו"ח גריאטריה למחלקות';
  totalResults: number = 0;
  isLoading: boolean = true;
  dataSource: MatTableDataSource<any> = new MatTableDataSource();
  unitOptions: string[] = [];
  camAssessmentGauge: number = 0;
  validCAMCount: number = 0;
  invalidCAMCount: number = 0;
  totalCAMCases: number = 0;
  displayedColumns: string[] = [
    'atD_Admission_Date', 'admission_No', 'age_Years', 'primaryUnit_Name', 'geriatricConsultation'
  ];

  columnLabels: { [key: string]: string } = {
    atD_Admission_Date: 'תאריך קבלה',
    admission_No: 'מספר מקרה',
    age_Years: 'גיל',
    primaryUnit_Name: 'מחלקה',
    geriatricConsultation: 'ייעוץ גריאטרי'
  };
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('pdfTable', { static: false }) pdfTable!: ElementRef;

  filterForm: FormGroup;

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      globalFilter: [''],
      unitFilter: ['']
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.setupFilterListeners();
  }

  loadData(): void {
    this.isLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}MitavGeriatricForDept`).subscribe(
      (data) => {
        this.dataSource = new MatTableDataSource(data);
        this.totalResults = data.length;
        this.calculateCAMStats();

        this.unitOptions = [...new Set(data.map((item) => item.primaryUnit_Name))].sort();
        setTimeout(() => {
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        });
        this.isLoading = false;
      },
      (error) => {
        console.error('Error fetching data', error);
        this.isLoading = false;
      }
    );
  }

  setupFilterListeners(): void {
    this.filterForm.get('globalFilter')?.valueChanges.subscribe(() => this.applyFilter());
    this.filterForm.get('unitFilter')?.valueChanges.subscribe(() => this.applyFilter());
  }

  applyFilter(): void {
    const globalFilterValue = this.filterForm.get('globalFilter')?.value?.trim().toLowerCase() || '';
    const unitFilterValue = this.filterForm.get('unitFilter')?.value || '';

    this.dataSource.filterPredicate = (data, filter) => {
      const filterObject = JSON.parse(filter);
      const matchesGlobalFilter = !filterObject.global || Object.values(data).some(
        (value) => value && value.toString().toLowerCase().includes(filterObject.global)
      );
      const matchesUnitFilter = !filterObject.unit || 
      (data.primaryUnit_Name && data.primaryUnit_Name === filterObject.unit);
      return matchesGlobalFilter && matchesUnitFilter;
    };

    this.dataSource.filter = JSON.stringify({ global: globalFilterValue, unit: unitFilterValue });
    this.totalResults = this.dataSource.filteredData.length;

    this.calculateCAMStats(); // ✅ Update gauge on filter
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.applyFilter();
  }

  exportToExcel(): void {
    const dataToExport = this.dataSource.filteredData.length ? this.dataSource.filteredData : [];
    const formattedData = dataToExport.map((item) => {
      let newItem: { [key: string]: any } = {};
      Object.keys(this.columnLabels).forEach((key) => {
        newItem[this.columnLabels[key]] = item[key] ?? '';
      });
      return newItem;
    });

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook: XLSX.WorkBook = { Sheets: { 'דו"ח גריאטריה': worksheet }, SheetNames: ['דו"ח גריאטריה'] };
    XLSX.writeFile(workbook, 'דו"ח_גריאטריה.xlsx');
  }

  calculateCAMStats(): void {
    const total = this.dataSource.filteredData.length;
    const valid = this.dataSource.filteredData.filter((row) => row.geriatricConsultation === 'כן').length;
    const invalid = total - valid;
  
    this.validCAMCount = valid;
    this.invalidCAMCount = invalid;
    this.totalCAMCases = total;
  
    this.camAssessmentGauge = total > 0 ? (valid / total) * 100 : 0;
  }
  
  camAssessmentGaugeColor(): string {
    return this.camAssessmentGauge >= 50 ? 'green' : 'red';
  }
  isDateColumn(column: string): boolean {
    const dateColumns = ['aTD_Admission_Date']; // ✅ Add all date column names here
    return dateColumns.includes(column);
  }
  
}