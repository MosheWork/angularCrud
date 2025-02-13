import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-mitav-delirium',
  templateUrl: './mitav-delirium.component.html',
  styleUrls: ['./mitav-delirium.component.scss']
})
export class MitavDeliriumComponent implements OnInit {

  displayedColumns: string[] = [
    'Admission_No',
    'Unit',
    'ATD_Admission_Date',
    'Release_Date',
    'Grade',
    'PatientWithDelirium',
    'PatientWithDeliriumEntryDate',
    'DeliriumDaysCount',
    'DeliriumConsiliumsOpened',
    'DeliriumConsiliumsDate',
    'HoursDifference',
    'PreventionAndInterventionCAM',
    'PreventionORInterventionCAM',
    'ReleaseCAM'
  ];
  selectedYear: number | null = null;
selectedQuarter: string | null = null;
yearList: number[] = [];
startDate: Date | null = null;
endDate: Date | null = null;
originalData: any[] = [];
globalFilterValue: string = ''; // Store global filter text

  dataSource = new MatTableDataSource<any>();
  isLoading: boolean = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchMitavDeliriumReport();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
      if (this.sort) {
        this.dataSource.sort = this.sort;
      }
      this.dataSource._updateChangeSubscription();
    }, 500);
  }

  fetchMitavDeliriumReport(): void {
    this.http.get<any[]>(`${environment.apiUrl}/MITAVMobility/GetMitavDeliriumReport`).subscribe(
      (data) => {
        console.log('Mitav Delirium Report Data:', data);
        this.dataSource.data = data;
        this.originalData = data; // Store original data

        setTimeout(() => {
          if (this.paginator) {
            this.dataSource.paginator = this.paginator;
          }
          if (this.sort) {
            this.dataSource.sort = this.sort;
          }
          this.dataSource._updateChangeSubscription();
        }, 500);

        this.isLoading = false;
      },
      (error) => {
        console.error('❌ Error fetching Mitav Delirium Report:', error);
        this.isLoading = false;
      }
    );
  }
  applyFilters(): void {
    let filteredData = [...this.originalData];
  
    
// ✅ Apply Date Filter based on ATD_Admission_Date and Release_Date
if (this.startDate || this.endDate) {
  filteredData = filteredData.filter((item) => {
    // ✅ Ensure correct date conversion
    const admissionDate = item.ATD_Admission_Date ? new Date(item.ATD_Admission_Date) : null;
    const releaseDate = item.Release_Date ? new Date(item.Release_Date) : null;

    // ✅ Ensure comparison works with time removed
    const start = this.startDate ? new Date(this.startDate.setHours(0, 0, 0, 0)) : null;
    const end = this.endDate ? new Date(this.endDate.setHours(23, 59, 59, 999)) : null;

    return (
      (!start || (admissionDate && admissionDate >= start) || (releaseDate && releaseDate >= start)) &&
      (!end || (admissionDate && admissionDate <= end) || (releaseDate && releaseDate <= end))
    );
  });
}


  
    // // ✅ Apply Department Filter
    // if (this.selectedDepartments.length > 0) {
    //   filteredData = filteredData.filter((item) =>
    //     this.selectedDepartments.includes(item.UnitName)
    //   );
    // }
  
    // ✅ Apply Year Filter
    if (this.selectedYear) {
      filteredData = filteredData.filter(
        (item) => new Date(item.AdmissionDate).getFullYear() === this.selectedYear
      );
    }
  
    // ✅ Apply Quarter Filter
    if (this.selectedQuarter) {
      filteredData = filteredData.filter((item) => {
        const month = new Date(item.AdmissionDate).getMonth() + 1;
        if (this.selectedQuarter === 'Q1') return month >= 1 && month <= 3;
        if (this.selectedQuarter === 'Q2') return month >= 4 && month <= 6;
        if (this.selectedQuarter === 'Q3') return month >= 7 && month <= 9;
        if (this.selectedQuarter === 'Q4') return month >= 10 && month <= 12;
        return false;
      });
    }
  
    this.dataSource.data = filteredData;
  
  }
  resetFilters(): void {
    this.startDate = null;
    this.endDate = null;
    //this.selectedDepartments = [];
    this.selectedYear = null;
    this.selectedQuarter = null;
    this.dataSource.data = this.originalData;
  
    // ✅ Reset Gauge Value
  }
  applyGlobalFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.globalFilterValue = filterValue.trim().toLowerCase();
  
    this.dataSource.filter = this.globalFilterValue;
  }
  
}
