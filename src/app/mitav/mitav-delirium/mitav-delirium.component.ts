import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { environment } from '../../../environments/environment';
import { ElementRef } from '@angular/core'; // ✅ Fix ElementRef error
import { Chart, ChartType, ChartData, registerables } from 'chart.js'; // ✅ Fix Chart error


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
    'GradeEntryDate',
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
  showGraph: boolean = false;
  departmentWiseCAMData: { department: string; validPercentage: number }[] = [];
  
  
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

// CAM Assessment Gauge Data
validCAMCount: number = 0;
invalidCAMCount: number = 0;
totalCAMCases: number = 0;
camAssessmentGauge: number = 0;

camAssessmentGaugeColor(): string {
  return this.camAssessmentGauge > 80 ? '#28a745' : this.camAssessmentGauge > 50 ? '#ffc107' : '#dc3545';
}

  dataSource = new MatTableDataSource<any>();
  isLoading: boolean = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('barChart') barChartRef!: ElementRef<HTMLCanvasElement>;
private barChart!: Chart;

constructor(private http: HttpClient) {
  Chart.register(...registerables);
}
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
// Calculate Gauge Data
this.totalCAMCases = data.length;
this.validCAMCount = data.filter(item => item.Grade && item.Grade.trim() !== '' && item.Grade !== 'אין תיעוד').length;
this.invalidCAMCount = this.totalCAMCases - this.validCAMCount;
this.calculateDepartmentWiseCAMData(data);

// Calculate percentage
this.camAssessmentGauge = this.totalCAMCases > 0 ? (this.validCAMCount / this.totalCAMCases) * 100 : 0;

  
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
  
    // ✅ Recalculate Gauge Data Based on Filtered Data
this.totalCAMCases = filteredData.length;
this.validCAMCount = filteredData.filter(item => item.Grade && item.Grade.trim() !== '' && item.Grade !== 'אין תיעוד').length;
this.invalidCAMCount = this.totalCAMCases - this.validCAMCount;

// ✅ Update Gauge Percentage
this.camAssessmentGauge = this.totalCAMCases > 0 ? (this.validCAMCount / this.totalCAMCases) * 100 : 0;
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
    // ✅ Reset Gauge Values
this.totalCAMCases = this.originalData.length;
this.validCAMCount = this.originalData.filter(item => item.Grade && item.Grade.trim() !== '' && item.Grade !== 'אין תיעוד').length;
this.invalidCAMCount = this.totalCAMCases - this.validCAMCount;
this.camAssessmentGauge = this.totalCAMCases > 0 ? (this.validCAMCount / this.totalCAMCases) * 100 : 0;

  
    // ✅ Reset Gauge Value
  }
  applyGlobalFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.globalFilterValue = filterValue.trim().toLowerCase();
  
    this.dataSource.filter = this.globalFilterValue;
  }
  toggleView(): void {
    this.showGraph = !this.showGraph;
    if (this.showGraph) {
      setTimeout(() => this.initializeChart(), 100);
    }
  }
  calculateDepartmentWiseCAMData(data: any[]): void {
    const departmentMap = new Map<string, { totalCases: number; validCases: number }>();
  
    data.forEach(item => {
      const department = item.Name || 'Unknown';
      const isValid = item.Grade && item.Grade.trim() !== '' && item.Grade !== 'אין תיעוד';
  
      if (!departmentMap.has(department)) {
        departmentMap.set(department, { totalCases: 0, validCases: 0 });
      }
  
      departmentMap.get(department)!.totalCases++;
      if (isValid) departmentMap.get(department)!.validCases++;
    });
  
    this.departmentWiseCAMData = Array.from(departmentMap.entries()).map(([department, counts]) => ({
      department,
      validPercentage: counts.totalCases > 0 ? (counts.validCases / counts.totalCases) * 100 : 0
    }));
  }
  
  initializeChart(): void {
    if (!this.barChartRef || !this.barChartRef.nativeElement) {
      console.warn('Chart canvas is not available yet.');
      setTimeout(() => this.initializeChart(), 100);
      return;
    }
  
    if (this.barChart) {
      this.barChart.destroy();
    }
  
    const ctx = this.barChartRef.nativeElement.getContext('2d');
    if (ctx) {
      // 🎨 Define a set of unique colors for each department
      const departmentColors: string[] = [
        '#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#A133FF',
        '#FF8C33', '#33FFF5', '#FF3333', '#33FFA1', '#A1FF33'
      ];
  
      // 🔄 Dynamically assign colors to departments (Fix: Use `departmentWiseCAMData`)
      const backgroundColors = this.departmentWiseCAMData.map((_dept: any, index: number) =>
        departmentColors[index % departmentColors.length] // Wrap around colors
      );
  
      this.barChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.departmentWiseCAMData.map((dept: any) => dept.department), // ✅ Fix: Use `departmentWiseCAMData`
          datasets: [
            {
              label: 'אחוז ניידות תקין לפי מחלקה',
              data: this.departmentWiseCAMData.map((dept: any) => dept.validPercentage), // ✅ Fix: Use `departmentWiseCAMData`
              backgroundColor: backgroundColors, // ✅ Unique Colors
              borderColor: backgroundColors.map((color: string) => color.replace('1)', '0.8)')), // Slightly Darker Border
              borderWidth: 1,
            },
          ],
        },
      options: {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        font: {
          size: 16 // ✅ Increase legend text size
        }
      }
    },
    tooltip: {
      enabled: true,
      callbacks: {
        label: (tooltipItem) => {
          let value = tooltipItem.raw as number;
          return `${value.toFixed(1)}%`; // ✅ Show 1 decimal place
        }
      }
    },
    datalabels: { // ✅ Show values inside bars
      anchor: 'center',
      align: 'center',
      color: 'black', // ✅ Make text black
      font: {
        size: 16, // ✅ Increase text size
        weight: 'bold'
      },
      formatter: (value: number) => `${value.toFixed(1)}%` // ✅ Format to 1 decimal place
    }
  }
}

        ,
      });
    }
  }
  
  
}
