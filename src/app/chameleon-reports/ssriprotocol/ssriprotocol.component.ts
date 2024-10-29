import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-ssri-protocol',
  templateUrl: './ssriprotocol.component.html',
  styleUrls: ['./ssriprotocol.component.scss']
})
export class SSRIProtocolComponent implements OnInit {
  totalResults: number = 0;
  titleUnit: string = 'SSRI Protocol Report';
  Title1: string = 'Total Records: ';
  Title2: string = '';

  columns: string[] = ['IdNum', 'AdmissionNo', 'FirstName', 'LastName', 'OrderStartDate'];
  dataSource: any[] = [];
  filteredData: any[] = [];
  matTableDataSource: MatTableDataSource<any>;

  filterForm: FormGroup;
  icd9Code: FormControl;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private fb: FormBuilder, private router: Router) {
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
    this.icd9Code = new FormControl('');
  }

  ngOnInit() {
    this.fetchSSRIProtocolData();  // Fetch data when the component initializes
    this.setupFormValueChanges();  // Set up dynamic filtering on value changes
  }

  // Fetch data based on the ICD9 code entered
  fetchSSRIProtocolData() {
    // API call to fetch data
    this.http.get<any[]>(`${environment.apiUrl}SSRIprotocol`)
      .subscribe((data) => {
        this.dataSource = data;
        this.filteredData = [...data];
        this.matTableDataSource = new MatTableDataSource(this.filteredData);
        this.matTableDataSource.paginator = this.paginator;
        this.matTableDataSource.sort = this.sort;
        this.applyFilters();  // Apply initial filters
      }, error => {
        console.error('Error fetching SSRI protocol data:', error);
      });
  }

  // Create form group with global filter and column-specific filters
  createFilterForm(): FormGroup {
    const formControls: { [key: string]: FormControl } = {};
    this.columns.forEach((column) => {
      formControls[column] = new FormControl(''); // Add form controls for each column
    });
    formControls['globalFilter'] = new FormControl(''); // Add global filter form control

    return this.fb.group({
      globalFilter: [''],
      startEntryDate: [''],  // Form control for start date
      endEntryDate: [''],    // Form control for end date
    });
  }

  // Set up form control value changes to trigger filtering
  setupFormValueChanges() {
    this.filterForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.applyFilters();
        this.paginator.firstPage();  // Reset to first page after filtering
      });
  }

  // Apply global and column-specific filters
  applyFilters() {
    const filters = this.filterForm.value;
    const globalFilter = (filters['globalFilter'] || '').toLowerCase();
    const startEntryDate = filters['startEntryDate'] ? new Date(filters['startEntryDate']) : null;
    const endEntryDate = filters['endEntryDate'] ? new Date(filters['endEntryDate']) : null;
  
    this.filteredData = this.dataSource.filter((item) => {
      const globalMatch = this.columns.some((column) => {
        const value = (item[column] || '').toString().toLowerCase();
        return value.includes(globalFilter);
      });
  
      // Date filter: check if OrderStartDate is within range
      let dateMatch = true;  // Default to true if no date range provided
      if (startEntryDate || endEntryDate) {
        const entryDate = new Date(item.OrderStartDate);
        if (startEntryDate && entryDate < startEntryDate) {
          dateMatch = false;
        }
        if (endEntryDate && entryDate > endEntryDate) {
          dateMatch = false;
        }
      }
  
      return (globalFilter === '' || globalMatch) && dateMatch;
    });
  
    // Update total results and table
    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
    this.matTableDataSource.paginator = this.paginator;
  }

  resetFilters() {
    this.filterForm.reset();
    this.applyFilters();
  }

  exportToExcel() {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filteredData);
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'ssri_protocol_report.xlsx';
    link.click();
  }

  goToHome() {
    this.router.navigate(['/MainPageReports']);
  }
}
