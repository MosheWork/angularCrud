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
  selector: 'app-er-info',
  templateUrl: './erinfo.component.html',
  styleUrls: ['./erinfo.component.scss']
})
export class ERInfoComponent implements OnInit {
  totalResults: number = 0;
  titleUnit: string = 'מידע חדר מיון';
  Title1: string = ' סה\"כ תוצאות: ';
  Title2: string = '';
  totalResultsUrgency: number = 0;
  totalResultsComplaint: number = 0;

  showGraph: boolean = false;
  graphData: any[] = [];
  isLoadingUrgency: boolean = true;
  isLoadingComplaint: boolean = true;
  urgencyFilterForm: FormGroup;
  complaintFilterForm: FormGroup;

  urgencyColumns: string[] = [
    'Urgent', 'Name', 'EntryDate', 'AdmissionNo', 
    'AdjustedAdmissionNo', 'IdNum', 'ReleaseDate', 'ArrivalDate'
  ];

  complaintColumns: string[] = [
    'DescriptionText', 'EntryDate', 'EntryUserFullName',
    'IdNum', 'AdmissionNo', 'ReleaseDate', 'ArrivalDate'
  ];

  dataSource: any[] = [];
  filteredData: any[] = [];
  matTableDataSource: MatTableDataSource<any>;
  urgencyDataSource = new MatTableDataSource<any>([]);
  complaintDataSource = new MatTableDataSource<any>([]);
 // filterForm: FormGroup;

  @ViewChild('urgencyPaginator') urgencyPaginator!: MatPaginator;
  @ViewChild('complaintPaginator') complaintPaginator!: MatPaginator;
  @ViewChild('urgencySort') urgencySort!: MatSort;
  @ViewChild('complaintSort') complaintSort!: MatSort;



  constructor(private http: HttpClient, private fb: FormBuilder, private router: Router) {
    //this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
    this.urgencyFilterForm = this.createFilterForm(this.urgencyColumns);
    this.complaintFilterForm = this.createFilterForm(this.complaintColumns);
  }

  ngOnInit() {
    this.loadUrgencyData();
    this.loadComplaintData();
      // Apply filters for urgency tab
      this.urgencyFilterForm.valueChanges.subscribe(() => this.applyUrgencyFilters());
      // Apply filters for complaint tab
      this.complaintFilterForm.valueChanges.subscribe(() => this.applyComplaintFilters());
  }
 
  loadUrgencyData() {
    this.http.get<any[]>(environment.apiUrl + 'ERInfo/UrgencyTab').subscribe(data => {
      this.urgencyDataSource.data = data;
      this.urgencyDataSource.paginator = this.urgencyPaginator;
      this.urgencyDataSource.sort = this.urgencySort;
      //this.totalResultsUrgency = data.length;
      this.isLoadingUrgency = false;
      this.totalResultsUrgency = data.length; // Update the count

    });
  }

  loadComplaintData() {
    this.http.get<any[]>(environment.apiUrl + 'ERInfo/ComplaintTab').subscribe(data => {
      this.complaintDataSource.data = data;
      this.complaintDataSource.paginator = this.complaintPaginator;
      this.complaintDataSource.sort = this.complaintSort;
      //this.totalResultsComplaint = data.length;
      this.isLoadingComplaint = false;
      this.totalResultsComplaint = data.length; // Update the count

    });
  }

  private createFilterForm(columns: string[]): FormGroup {
    const formControls: any = {};
    columns.forEach(column => {
      formControls[column] = new FormControl('');
    });
    formControls['globalFilter'] = new FormControl('');
    return this.fb.group(formControls);
  }
   applyUrgencyFilters() {
    const filters = this.urgencyFilterForm.value;
    const globalFilter = (filters['globalFilter'] || '').toLowerCase();

    this.urgencyDataSource.data = this.urgencyDataSource.data.filter(item =>
      this.urgencyColumns.every(column => {
        const value = item[column];
        const filterValue = filters[column] || '';
        return (
          value?.toString().toLowerCase().includes(filterValue.toLowerCase()) &&
          (!globalFilter || this.urgencyColumns.some(col => item[col]?.toString().toLowerCase().includes(globalFilter)))
        );
      })
    );

    this.totalResultsComplaint = this.complaintDataSource.filteredData.length;
  }

  applyComplaintFilters() {
    const filters = this.complaintFilterForm.value;
    const globalFilter = (filters['globalFilter'] || '').toLowerCase();

    this.complaintDataSource.data = this.complaintDataSource.data.filter(item =>
      this.complaintColumns.every(column => {
        const value = item[column];
        const filterValue = filters[column] || '';
        return (
          value?.toString().toLowerCase().includes(filterValue.toLowerCase()) &&
          (!globalFilter || this.complaintColumns.some(col => item[col]?.toString().toLowerCase().includes(globalFilter)))
        );
      })
    );

    this.totalResultsComplaint = this.complaintDataSource.data.length;
  }

  resetUrgencyFilters() {
    this.urgencyFilterForm.reset();
    this.applyUrgencyFilters();
  }
  
  resetComplaintFilters() {
    this.complaintFilterForm.reset();
    this.applyComplaintFilters();
  }
  exportToExcel() {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filteredData);
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'er_info.xlsx';
    link.click();
  }

  navigateToGraphPage() {
    this.showGraph = !this.showGraph;
  }

  goToHome() {
    this.router.navigate(['/MainPageReports']);
  }
}