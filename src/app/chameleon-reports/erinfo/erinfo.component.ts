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
 // Loading states
 isLoadingUrgency = true;
 isLoadingComplaint = true;
 isLoadingDischarge = true;
 isLoadingSignature = true;
 isLoadingDecision = true;

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
  dischargeColumns: string[] = [
    'EntryDate', 'EntryUserFullName', 'IdNum', 'AdmissionNo', 'ReleaseDate', 'ArrivalDate'
  ];
  signatureColumns: string[] = [
    'EntryDate', 'EntryUserFullName', 'IdNum', 'AdmissionNo', 'ReleaseDate', 'ArrivalDate'
  ];
  decisionColumns: string[] = ['EntryDate', 'Decision', 'DecisionDescription', 'EntryUserFullName', 'IdNum', 'AdmissionNo', 'ReleaseDate', 'ArrivalDate'];

  globalFilter: FormControl = new FormControl('');

  dataSource: any[] = [];
  filteredData: any[] = [];
  // Data sources
  urgencyDataSource = new MatTableDataSource<any>([]);
  complaintDataSource = new MatTableDataSource<any>([]);
  dischargeDataSource = new MatTableDataSource<any>([]);
  signatureDataSource = new MatTableDataSource<any>([]);
  decisionDataSource = new MatTableDataSource<any>([]);
 // filterForm: FormGroup;
 urgencyFilter = new FormControl('');
 complaintFilter = new FormControl('');
 dischargeFilter = new FormControl('');
 signatureFilter = new FormControl('');
 decisionFilter = new FormControl('');

 @ViewChild('urgencyPaginator') urgencyPaginator!: MatPaginator;
 @ViewChild('complaintPaginator') complaintPaginator!: MatPaginator;
 @ViewChild('dischargePaginator') dischargePaginator!: MatPaginator;
 @ViewChild('signaturePaginator') signaturePaginator!: MatPaginator;
 @ViewChild('decisionPaginator') decisionPaginator!: MatPaginator;
 @ViewChild('urgencySort') urgencySort!: MatSort;
 @ViewChild('complaintSort') complaintSort!: MatSort;
 @ViewChild('dischargeSort') dischargeSort!: MatSort;
 @ViewChild('signatureSort') signatureSort!: MatSort;
 @ViewChild('decisionSort') decisionSort!: MatSort;

  constructor(private http: HttpClient, private fb: FormBuilder, private router: Router) {
    //this.filterForm = this.createFilterForm();
   // this.matTableDataSource = new MatTableDataSource<any>([]);
    this.urgencyFilterForm = this.createFilterForm(this.urgencyColumns);
    this.complaintFilterForm = this.createFilterForm(this.complaintColumns);
  }

  ngOnInit() {
    this.loadUrgencyData();
    this.loadComplaintData();
    this.loadDischargeData();
    this.loadSignatureData();
    this.loadDecisionData();

    this.setupFilter(this.urgencyFilter, this.urgencyDataSource);
    this.setupFilter(this.complaintFilter, this.complaintDataSource);
    this.setupFilter(this.dischargeFilter, this.dischargeDataSource);
    this.setupFilter(this.signatureFilter, this.signatureDataSource);
    this.setupFilter(this.decisionFilter, this.decisionDataSource);
  }

  setupFilter(filterControl: FormControl, dataSource: MatTableDataSource<any>) {
    filterControl.valueChanges.subscribe((value) => {
      dataSource.filter = value.trim().toLowerCase();
    });
  }

  loadDecisionData() {
    this.http.get<any[]>(environment.apiUrl + 'ERInfo/AdmissionTreatmentDecisionTab').subscribe((data) => {
      this.decisionDataSource.data = data;
      this.decisionDataSource.paginator = this.decisionPaginator;
      this.decisionDataSource.sort = this.decisionSort;
      this.isLoadingDecision = false;
    });
  }
  loadDischargeData() {
    this.http.get<any[]>(environment.apiUrl + 'ERInfo/DischargeDateTab').subscribe(data => {
      this.dischargeDataSource.data = data;
      this.dischargeDataSource.paginator = this.dischargePaginator;
      this.dischargeDataSource.sort = this.dischargeSort;
      this.isLoadingDischarge = false;
    });
  }

  loadSignatureData() {
    this.http.get<any[]>(environment.apiUrl + 'ERInfo/DoctorSignatureTab').subscribe(data => {
      this.signatureDataSource.data = data;
      this.signatureDataSource.paginator = this.signaturePaginator;
      this.signatureDataSource.sort = this.signatureSort;
      this.isLoadingSignature = false;
    });
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
    columns.forEach(column => (formControls[column] = new FormControl('')));
    formControls['globalFilter'] = new FormControl('');
    return this.fb.group(formControls);
  }






  exportToExcel(dataSource: MatTableDataSource<any>, fileName: string) {
    const data = dataSource.filteredData;
    if (data.length === 0) {
      alert('No data to export!');
      return;
    }
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `${fileName}.xlsx`;
    link.click();
  }

  resetFilter(control: FormControl) {
    control.reset();
  }



 
}