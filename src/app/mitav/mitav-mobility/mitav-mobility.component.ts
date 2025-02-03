import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { environment } from '../../../environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { DepartmentPercentagesDialogComponent } from '../department-percentages-dialog/department-percentages-dialog.component';


@Component({
  selector: 'app-mitav-mobility',
  templateUrl: './mitav-mobility.component.html',
  styleUrls: ['./mitav-mobility.component.scss'],
})
export class MitavMobilityComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'AdmissionNo',
    'UnitName',
    'AgeYears',
    'AdmissionDate',
    'ReleaseDate',
    'MobilityGrade',
    'ConsultationStatus',
    'RecommendationForWalking',
    'RequiredAssistiveDevice',
    'RecommendedWalkingDistance',
    'MorningShiftCount',
    'NightShiftCount',
    'DatesWithBothShifts',
    'TotalDaysInHospital',
    'TotalPercentage',
    'IsRecordMatchingReleaseDate',
    'HasRecordPerDate'
  ];

  dataSource = new MatTableDataSource<any>();
  mobilityGradeAverage: number = 0;

  startDate: Date | null = null;
  endDate: Date | null = null;
  originalData: any[] = [];
  gaugeValue: number = 0;
  departmentList: string[] = []; // List of unique departments
  selectedDepartments: string[] = []; // Selected departments for filtering
  departmentPercentages: { unitName: string; percentage: number }[] = [];
  showDepartmentList: boolean = false; // Toggle for department list
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.fetchMobilityReport();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  fetchMobilityReport(): void {
    this.http
      .get<any[]>(`${environment.apiUrl}/MITAVMobility/GetMobilityReport`)
      .subscribe(
        (data) => {
          console.log('Raw API Response:', data); // Debug log to inspect response
          this.dataSource.data = data;
          this.originalData = data; // Store original data

          this.calculateMobilityGradeAverage();
          this.calculateDepartmentPercentages();
          this.departmentList = Array.from(new Set(data.map((item) => item.UnitName || 'Unknown')));

        },
        (error) => {
          console.error('Error fetching Mobility Report data:', error);
        }
      );
  }
  


  applyDateFilter(): void {
    if (!this.startDate || !this.endDate) {
      return;
    }

    const filteredData = this.originalData.filter(item => {
      const admissionDate = new Date(item.AdmissionDate);
      return admissionDate >= this.startDate! && admissionDate <= this.endDate!;
    });

    this.dataSource.data = filteredData;
    this.calculateMobilityGradeAverage();
  }

  resetFilter(): void {
    this.startDate = null;
    this.endDate = null;
    this.dataSource.data = this.originalData;
    this.calculateMobilityGradeAverage();
    this.selectedDepartments = [];

  }
  applyDepartmentFilter(): void {
    if (this.selectedDepartments.length === 0) {
      this.dataSource.data = this.originalData; // Reset to original data if no departments are selected
      return;
    }

    this.dataSource.data = this.originalData.filter((item) =>
      this.selectedDepartments.includes(item.UnitName)
    );
  }

  calculateMobilityGradeAverage(): void {
    if (this.dataSource.data.length > 0) {
      const totalMobilityGrade = this.dataSource.data
        .map(item => item.MobilityGrade || 0)
        .reduce((sum, grade) => sum + grade, 0);
      
      this.mobilityGradeAverage = totalMobilityGrade / this.dataSource.data.length;
  
      // Calculate Gauge Value: (Total DatesWithBothShifts / TotalDaysInHospital) * 100
      const totalDatesWithBothShifts = this.dataSource.data
        .map(item => item.DatesWithBothShifts || 0)
        .reduce((sum, value) => sum + value, 0);
  
      const totalDaysInHospital = this.dataSource.data
        .map(item => item.TotalDaysInHospital || 1) // Avoid division by zero
        .reduce((sum, value) => sum + value, 0);
  
      this.gaugeValue = totalDaysInHospital > 0 
        ? (totalDatesWithBothShifts / totalDaysInHospital) * 100 
        : 0;
    } else {
      this.mobilityGradeAverage = 0;
      this.gaugeValue = 0;
    }
  }
  calculateDepartmentPercentages(): void {
    const departmentMap = new Map<string, { totalShifts: number; totalDays: number }>();
  
    this.dataSource.data.forEach(item => {
      const unitName = item.UnitName || 'Unknown';
      if (!departmentMap.has(unitName)) {
        departmentMap.set(unitName, { totalShifts: 0, totalDays: 0 });
      }
      departmentMap.get(unitName)!.totalShifts += item.DatesWithBothShifts || 0;
      departmentMap.get(unitName)!.totalDays += item.TotalDaysInHospital || 1;
    });
  
    this.departmentPercentages = Array.from(departmentMap.entries()).map(([unitName, data]) => ({
      unitName,
      percentage: data.totalDays > 0 ? (data.totalShifts / data.totalDays) * 100 : 0
    })).sort((a, b) => b.percentage - a.percentage);
  
    console.log('Department Percentages:', this.departmentPercentages); // Debug log
  }
  

toggleDepartmentList(): void {
  this.showDepartmentList = !this.showDepartmentList;
}

openDepartmentPercentagesDialog(): void {
  this.dialog.open(DepartmentPercentagesDialogComponent, {
    width: '600px',
    data: { percentages: this.departmentPercentages },
  });
}
getGaugeColor(): string {
  if (this.gaugeValue < 40) {
    return 'red';
  } else if (this.gaugeValue < 50) {
    return 'orange';
  } else {
    return 'green';
  }
}
}
