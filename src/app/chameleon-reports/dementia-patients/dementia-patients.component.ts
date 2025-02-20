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
      endDate: [new Date()]
    });
  }

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.isLoading = true;
    
    this.http.get<any[]>(`${environment.apiUrl}Dementia/DementiaPatients`)
      .subscribe(data => {
        this.originalData = data;
        this.applyFilters();
        this.isLoading = false;
      }, error => {
        console.error('Error fetching data', error);
        this.isLoading = false;
      });
  }

  applyFilters() {
    const { startDate, endDate } = this.filterForm.value;
    const formattedStartDate = this.formatDate(startDate);
    const formattedEndDate = this.formatDate(endDate);

    this.dataSource.data = this.originalData.filter(patient => {
      const patientDate = this.formatDate(patient.EntryDate);
      return patientDate >= formattedStartDate && patientDate <= formattedEndDate;
    });

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

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  exportToExcel() {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.dataSource.data);
    const workbook: XLSX.WorkBook = { Sheets: { 'Dementia Patients': worksheet }, SheetNames: ['Dementia Patients'] };
    XLSX.writeFile(workbook, 'Dementia_Patients.xlsx');
  }
}
