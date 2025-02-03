import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { environment } from '../../../environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { DepartmentPercentagesDialogComponent } from '../department-percentages-dialog/department-percentages-dialog.component';
import { DocumentationOfPatientMobilityDialogComponent } from '../documentation-of-patient-mobility-dialog/documentation-of-patient-mobility-dialog.component';


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
    'HasRecordPerDate',
    'CognitiveFunctionBeforeHospitalization',  // Added
    'MobilityBeforeHospitalization',          // Added
    'BasicFunctionBeforeHospitalization'
  ];

  dataSource = new MatTableDataSource<any>();
  mobilityGradeAverage: number = 0;
  isLoading:boolean=true;
  startDate: Date | null = null;
  endDate: Date | null = null;
  originalData: any[] = [];
  gaugeValue: number = 0;
  departmentList: string[] = []; // List of unique departments
  selectedDepartments: string[] = []; // Selected departments for filtering
  departmentPercentages: { unitName: string; percentage: number }[] = [];
  showDepartmentList: boolean = false; // Toggle for department list
  selectedYear: number | null = null;
selectedQuarter: string | null = null;
yearList: number[] = [];

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
    this.isLoading = true;
  
    this.http.get<any[]>(`${environment.apiUrl}/MITAVMobility/GetMobilityReport`).subscribe(
      (data) => {
        console.log('Raw API Response:', data); // ✅ Debug log to check data
  
        if (!data || data.length === 0) {
          console.warn('⚠️ No data received from API! Showing message instead of table.');
          this.dataSource.data = [];
          this.isLoading = false;
          return;
        }
  
        this.dataSource.data = data;
        this.originalData = data; // Store original data
  
        // ✅ Assign paginator after setting data
        setTimeout(() => {
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort; // Ensure sorting works too
        });
  
        this.isLoading = false;
        this.calculateMobilityGradeAverage();
        this.calculateDepartmentPercentages();
        this.calculateGaugeValue(this.dataSource.data);
  
        // ✅ Extract Unique Years from AdmissionDate
        this.yearList = Array.from(
          new Set(
            data.map((item) => new Date(item.AdmissionDate).getFullYear()).filter((y) => !isNaN(y))
          )
        ).sort((a, b) => b - a); // Sort years in descending order
  
        this.departmentList = Array.from(new Set(data.map((item) => item.UnitName || 'Unknown')));
      },
      (error) => {
        console.error('❌ Error fetching Mobility Report data:', error);
        this.isLoading = false; // ✅ Ensure loader disappears even on error
      }
    );
  }
  
  
  applyFilters(): void {
    let filteredData = [...this.originalData];
  
    // ✅ Apply Date Filter based on AdmissionDate
    if (this.startDate || this.endDate) {
      filteredData = filteredData.filter((item) => {
        const admissionDate = new Date(item.AdmissionDate);
        return (!this.startDate || admissionDate >= this.startDate) &&
               (!this.endDate || admissionDate <= this.endDate);
      });
    }
  
    // ✅ Apply Department Filter
    if (this.selectedDepartments.length > 0) {
      filteredData = filteredData.filter((item) =>
        this.selectedDepartments.includes(item.UnitName)
      );
    }
  
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
  
    // ✅ Update the Gauge based on the filtered data
    this.calculateGaugeValue(filteredData);
  }
  
  
  calculateGaugeValue(data: any[]): void {
    const totalDatesWithBothShifts = data
      .map((item) => item.DatesWithBothShifts || 0)
      .reduce((sum, value) => sum + value, 0);
  
    const totalDaysInHospital = data
      .map((item) => item.TotalDaysInHospital || 1) // Avoid division by zero
      .reduce((sum, value) => sum + value, 0);
  
    this.gaugeValue = totalDaysInHospital > 0
      ? (totalDatesWithBothShifts / totalDaysInHospital) * 100
      : 0;
  }
  


  resetFilters(): void {
    this.startDate = null;
    this.endDate = null;
    this.selectedDepartments = [];
    this.selectedYear = null;
    this.selectedQuarter = null;
    this.dataSource.data = this.originalData;
  
    // ✅ Reset Gauge Value
    this.calculateGaugeValue(this.originalData);
  }
  
  
  // applyDepartmentFilter(): void {
  //   if (this.selectedDepartments.length === 0) {
  //     this.dataSource.data = this.originalData; // Reset to original data if no departments are selected
  //     return;
  //   }

  //   this.dataSource.data = this.originalData.filter((item) =>
  //     this.selectedDepartments.includes(item.UnitName)
  //   );
  // }

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
  const departmentMap = new Map<string, { 
    totalShifts: number; 
    totalDays: number; 
    mobilityGrades: number[]; 
    recommendations: string[];
    cognitiveStates: string[]; // New field
    mobilityStates: string[];  // New field
    basicStates: string[];     // New field
  }>();

  this.dataSource.data.forEach(item => {
    const unitName = item.UnitName || 'Unknown';
    const mobilityGrade = item.MobilityGrade;
    const recommendation = item.RecommendationForWalking;
    const cognitive = item.CognitiveFunctionBeforeHospitalization; // New
    const mobility = item.MobilityBeforeHospitalization;           // New
    const basic = item.BasicFunctionBeforeHospitalization;         // New

    if (!departmentMap.has(unitName)) {
      departmentMap.set(unitName, { 
        totalShifts: 0, 
        totalDays: 0, 
        mobilityGrades: [], 
        recommendations: [], 
        cognitiveStates: [],  // Initialize
        mobilityStates: [],   // Initialize
        basicStates: []       // Initialize
      });
    }

    const department = departmentMap.get(unitName)!;
    department.totalShifts += item.DatesWithBothShifts || 0;
    department.totalDays += item.TotalDaysInHospital || 1;

    if (mobilityGrade !== null && mobilityGrade !== undefined && mobilityGrade !== '') {
      department.mobilityGrades.push(mobilityGrade);
    }

    if (recommendation !== null && recommendation !== undefined && recommendation !== '') {
      department.recommendations.push(recommendation);
    }

    // Push functional states
    department.cognitiveStates.push(cognitive);
    department.mobilityStates.push(mobility);
    department.basicStates.push(basic);
  });

  const departmentPercentages = Array.from(departmentMap.entries()).map(([unitName, data]) => ({
    unitName,
    percentage: data.totalDays > 0 ? (data.totalShifts / data.totalDays) * 100 : 0,
    mobilityGrades: data.mobilityGrades,
    recommendations: data.recommendations,
    cognitiveStates: data.cognitiveStates, // Added
    mobilityStates: data.mobilityStates,   // Added
    basicStates: data.basicStates          // Added
  }));

  this.dialog.open(DepartmentPercentagesDialogComponent, {
    width: '1200px',
    data: { percentages: departmentPercentages },
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


openDetailsDialog(admissionNo: string): void {
  const dialogRef = this.dialog.open(DocumentationOfPatientMobilityDialogComponent, {
    width: '800px',
    data: { admissionNo }
  });

  dialogRef.afterClosed().subscribe(() => {
    console.log('Details dialog closed');
  });
}

}
