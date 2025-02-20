import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormBuilder } from '@angular/forms';
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
  Title1: string = ' סה"כ תוצאות: ';
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
      startEntryDate: [null],  // ✅ Start empty
      endEntryDate: [null],    // ✅ Start empty
      globalFilter: ['']
    });
  }

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.isLoading = true;

    this.http.get<any[]>(`${environment.apiUrl}Dementia/DementiaPatients`)
      .subscribe(data => {
        // ✅ Convert EntryDate to a JavaScript Date object
        this.originalData = data.map(item => ({
          ...item,
          EntryDate: item.EntryDate ? new Date(item.EntryDate) : null
        }));

        this.applyFilters();
        this.totalResults = data.length;
        this.dataSource = new MatTableDataSource(this.originalData);

        // ✅ Assign paginator & sort AFTER setting data
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;

        this.isLoading = false;
      }, error => {
        console.error('Error fetching data', error);
        this.isLoading = false;
      });
  }

  applyFilters() {
    const { startEntryDate, endEntryDate, globalFilter } = this.filterForm.value;
    
    // ✅ Convert selected dates to Date objects for comparison
    const startDate = startEntryDate ? new Date(startEntryDate) : null;
    const endDate = endEntryDate ? new Date(endEntryDate) : null;

    console.log("Total API results:", this.originalData.length); // Debug API results

    this.dataSource.data = this.originalData.filter(patient => {
      const patientDate = patient.EntryDate ? new Date(patient.EntryDate) : null;

      const isDateInRange = 
        (!startDate || (patientDate && patientDate >= startDate)) &&
        (!endDate || (patientDate && patientDate <= endDate));

      const isGlobalMatch = !globalFilter || Object.values(patient).some(value =>
        value?.toString().toLowerCase().includes(globalFilter.toLowerCase())
      );

      return isDateInRange && isGlobalMatch;
    });

    console.log("Filtered results:", this.dataSource.data.length); // Debug filtered results
    this.totalResults = this.dataSource.data.length;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  resetFilters() {
    this.filterForm.setValue({
      startEntryDate: null,
      endEntryDate: null,
      globalFilter: ''
    });
    this.applyFilters();
  }

  exportToExcel() {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.dataSource.data);
    const workbook: XLSX.WorkBook = { Sheets: { 'Dementia Patients': worksheet }, SheetNames: ['Dementia Patients'] };
    XLSX.writeFile(workbook, 'Dementia_Patients.xlsx');
  }
}
