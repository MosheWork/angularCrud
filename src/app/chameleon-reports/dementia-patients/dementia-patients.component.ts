import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import * as XLSX from 'xlsx';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dementia-patients',
  templateUrl: './dementia-patients.component.html',
  styleUrls: ['./dementia-patients.component.scss']
})
export class DementiaPatientsComponent implements OnInit {
  totalResults: number = 0;
  titleUnit: string = 'מטופלים דימנטים ';
  Title1: string = ' סה"כ תוצאות: ';  // Title1 for display
  Title2: string = '';    

  displayedColumns: string[] = [
    'EntryDate', 'UnitName', 'ICD9', 'DiagnosisName', 'IdNum', 'AdmissionNo', 'FirstName', 'LastName'
  ];
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  originalData: any[] = [];

  filterForm: FormGroup;
  isLoading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      startDate: [new Date(new Date().setDate(new Date().getDate() - 30))], // Default: Last 30 Days
      endDate: [new Date()],
      Record_Date: [''],  // ✅ Added missing form control
      Entry_Date: [''],   // ✅ Added missing form control
      globalFilter: ['']  // ✅ Added missing form control
    });
}


  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.isLoading = true;
  
    const startDate = this.formatDate(this.filterForm.value.startEntryDate);
    const endDate = this.formatDate(this.filterForm.value.endEntryDate);
  
    this.http.get<any[]>(`${environment.apiUrl}Dementia/DementiaPatients?startDate=${startDate}&endDate=${endDate}`)
      .subscribe(data => {
        this.originalData = data; // Store original data
        this.applyFilters(); // Apply filters immediately
        this.totalResults=data.length
        // ✅ Ensure MatTableDataSource is updated
        this.dataSource.data = [...this.originalData]; 
  
        this.isLoading = false;
      }, error => {
        console.error('Error fetching data', error);
        this.isLoading = false;
      });
  }
  

  applyFilters() {
    const { startEntryDate, endEntryDate } = this.filterForm.value;
    const formattedStartDate = this.formatDate(startEntryDate);
    const formattedEndDate = this.formatDate(endEntryDate);
  
    console.log("Total API results:", this.originalData.length); // Debug API results
  
    this.dataSource.data = this.originalData.filter(patient => {
      const patientDate = this.formatDate(patient.EntryDate);
      return patientDate >= formattedStartDate && patientDate <= formattedEndDate;
    });
  
    console.log("Filtered results:", this.dataSource.data.length); // Debug filtered results
    this.totalResults = this.dataSource.data.length;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  


  resetFilters() {
    this.filterForm.setValue({
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
      endDate: new Date()
    });
    this.applyFilters();
  }

  formatDate(date: any): string {
    if (!date) return ''; // Handle null/undefined cases
    if (typeof date === 'string') {
      date = new Date(date); // Convert string to Date
    }
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    }
    return ''; // Return empty string if date is invalid
  }
  
  exportToExcel() {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.dataSource.data);
    const workbook: XLSX.WorkBook = { Sheets: { 'Dementia Patients': worksheet }, SheetNames: ['Dementia Patients'] };
    XLSX.writeFile(workbook, 'Dementia_Patients.xlsx');
  }
}
