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
    'Name',
    'Admission_No',
    'Age_Years',
    'ATD_Admission_Date',
    'AdmissionCAMGrade',
    'Grade',
    'PatientWithDelirium',
    'PatientWithDeliriumEntryDate',
    'DeliriumDaysCount',
    'DeliriumConsiliumsOpened',
    'DeliriumConsiliumsDate',
    'HoursDifference',
    //'PreventionAndInterventionCAM',
    'PreventionORInterventionCAM',
   'GradeCount',
   'DrugForDelirium',
   'ReleaseCAM',
   'CAMGradeChanged',
   'Release_Date',
  
  ];

  departmentList: string[] = []; // List of unique departments
  selectedDepartments: string[] = []; // Selected departments for filtering

  selectedYear: number | null = null;
selectedQuarter: string | null = null;
quarterList: string[] = ['Q1', 'Q2', 'Q3', 'Q4'];  // ✅ Fixed: Define valid quarters

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
        this.originalData = data;
  
        // ✅ Extract Unique Years from ATD_Admission_Date & Release_Date
        const years = new Set<number>();
        data.forEach(item => {
          if (item.ATD_Admission_Date) {
            years.add(new Date(item.ATD_Admission_Date).getFullYear());
          }
          if (item.Release_Date) {
            years.add(new Date(item.Release_Date).getFullYear());
          }
          if (item.DeliriumConsiliumsDate) {
            years.add(new Date(item.DeliriumConsiliumsDate).getFullYear());
          }
        });

      
  
        this.yearList = Array.from(years).sort((a, b) => b - a); // Sort years descending
  
        // ✅ Populate Department List
        this.departmentList = Array.from(new Set(data.map((item) => item.Name || 'Unknown')));
  
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
        console.log('משה'+ this.isLoading)
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


  
    // ✅ Apply Department Filter
    if (this.selectedDepartments.length > 0) {
      filteredData = filteredData.filter((item) =>
        this.selectedDepartments.includes(item.Name)
      );
    }
  
    // ✅ Apply Year Filter
   // ✅ Apply Year Filter
if (this.selectedYear) {
  filteredData = filteredData.filter((item) => {
    const admissionYear = item.ATD_Admission_Date ? new Date(item.ATD_Admission_Date).getFullYear() : null;
    const releaseYear = item.Release_Date ? new Date(item.Release_Date).getFullYear() : null;

    return (admissionYear === this.selectedYear) || (releaseYear === this.selectedYear);
  });
}
  
// ✅ Apply Quarter Filter
if (this.selectedQuarter) {
  const quarterMapping: { [key: string]: number[] } = {
    'רבעון 1': [1, 2, 3],  // Q1 (January-March)
    'רבעון 2': [4, 5, 6],  // Q2 (April-June)
    'רבעון 3': [7, 8, 9],  // Q3 (July-September)
    'רבעון 4': [10, 11, 12] // Q4 (October-December)
  };

  // Ensure selectedQuarter is a valid string before accessing the mapping
  const selectedQuarterKey = this.selectedQuarter ? this.selectedQuarter.trim() : '';

  if (quarterMapping[selectedQuarterKey]) {
    filteredData = filteredData.filter((item) => {
      const admissionMonth = item.ATD_Admission_Date ? new Date(item.ATD_Admission_Date).getMonth() + 1 : null;
      const releaseMonth = item.Release_Date ? new Date(item.Release_Date).getMonth() + 1 : null;

      console.log('Checking Quarter:', selectedQuarterKey);
      console.log('Admission Month:', admissionMonth);
      console.log('Release Month:', releaseMonth);

      return (
        (admissionMonth && quarterMapping[selectedQuarterKey].includes(admissionMonth)) ||
        (releaseMonth && quarterMapping[selectedQuarterKey].includes(releaseMonth))
      );
    });

    console.log('Final Filtered Data:', filteredData.length);
  } else {
    console.error('Invalid Quarter Selected:', selectedQuarterKey);
  }
}



  
    this.dataSource.data = filteredData;
  
  }
  resetFilters(): void {
    this.startDate = null;
    this.endDate = null;
    this.selectedDepartments = [];
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
