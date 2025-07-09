import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import * as XLSX from 'xlsx';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-pci-report',
  templateUrl: './pci-report.component.html',
  styleUrls: ['./pci-report.component.scss']
})
export class PCIreportComponent implements OnInit {
  totalResults: number = 0;
  titleUnit: string = 'דו״ח PCI';
  Title1: string = ' סה"כ תוצאות: ';
  Title2: string = '';    

  displayedColumns: string[] = [
    'CaseNumber', 'DRG_Desc_KABALA', 'DRG_DOC_Desc_KABALA',
    'DOC_ICD9', 'DRG_Code_Invoice', 'PCI_Date', 'Hosp_Date',
    'TimeCuttingTime', 'TimeEndSurgery', 'TimeExitingTheOperatingRoom',
    'TimeEntranceToTheRecoveryRoom', 'TimeSendPatientBackToDepart',
    'TimeExitRecoveryRoom'
  ];

  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  originalData: any[] = [];
  filterForm: FormGroup;
  isLoading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.filterForm = this.fb.group({
      startDate: [null],
      endDate: [null],
      globalFilter: ['']
    });
  }

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.isLoading = true;
  
    // קרא מהטופס
    const startDate = this.filterForm.value.startDate
      ? new Date(this.filterForm.value.startDate).toISOString().slice(0, 10)
      : null;
  
    const endDate = this.filterForm.value.endDate
      ? new Date(this.filterForm.value.endDate).toISOString().slice(0, 10)
      : null;
  
    const params: any = {};
    if (startDate) params.FromDate = startDate;
    if (endDate) params.ToDate = endDate;
  
    this.http.get<any[]>(`${environment.apiUrl}PCIreport`, { params }).subscribe(
      data => {
        this.originalData = data;
        this.applyFilters();
        this.isLoading = false;
      },
      err => {
        console.error(err);
        this.isLoading = false;
      }
    );
  }
  
  

  applyFilters() {
    const { globalFilter } = this.filterForm.value;

    const filteredData = this.originalData.filter(row =>
      !globalFilter || Object.values(row).some(value =>
        value?.toString().toLowerCase().includes(globalFilter.toLowerCase())
      )
    );

    this.dataSource.data = [...filteredData];
    this.totalResults = this.dataSource.data.length;

    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  resetFilters() {
    this.filterForm.setValue({
      globalFilter: ''
    });
    this.applyFilters();
  }

  exportToExcel() {
    const filteredData = this.dataSource.filteredData;

    if (filteredData.length === 0) {
      alert('אין נתונים לייצוא!');
      return;
    }

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook: XLSX.WorkBook = { Sheets: { 'PCI Report': worksheet }, SheetNames: ['PCI Report'] };
    XLSX.writeFile(workbook, 'PCI_Report.xlsx');
  }
}
