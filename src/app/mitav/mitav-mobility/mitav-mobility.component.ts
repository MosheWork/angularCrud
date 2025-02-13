import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { environment } from '../../../environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { DepartmentPercentagesDialogComponent } from '../department-percentages-dialog/department-percentages-dialog.component';
import { DocumentationOfPatientMobilityDialogComponent } from '../documentation-of-patient-mobility-dialog/documentation-of-patient-mobility-dialog.component';
import { ElementRef } from '@angular/core';

import { Chart, ChartData, ChartType, registerables } from 'chart.js';

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
    //'MorningShiftCount',
    //'NightShiftCount',
    'DatesWithBothShifts',
    'TotalDaysInHospital',
    'TotalPercentage',
    'IsRecordMatchingReleaseDate',
    'HasRecordPerDate',
    'CognitiveFunctionBeforeHospitalization',  // Added
    'MobilityBeforeHospitalization',          // Added
    'BasicFunctionBeforeHospitalization'
  ];
  globalFilterValue: string = ''; // Store global filter text
  deliriumDataSource = new MatTableDataSource<any>();

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
totalMobilityPercentage: number = 0; // Add a property to store the percentage
mobilityGradeChartData: { name: string; value: number }[] = [];
showGraph: boolean = false;
colorScheme = {
  domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA'], // Example colors
};
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;



  constructor(private http: HttpClient, private dialog: MatDialog) {    Chart.register(...registerables); // Register Chart.js components
}

  ngOnInit(): void {
    this.fetchMobilityReport();

    this.dataSource.filterPredicate = this.createFilterPredicate();

  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    if (this.showGraph) {
      this.prepareChartData();
      this.initializeChart();
    }

  
  }
  createFilterPredicate(): (data: any, filter: string) => boolean {
    return (data: any, filter: string): boolean => {
      const filterText = filter.trim().toLowerCase();
  
      // ✅ Convert all data properties to a single string for search
      const dataString = Object.values(data)
        .map(value => (value ? value.toString().toLowerCase() : ''))
        .join(' ');
  
      return dataString.includes(filterText);
    };
  }
  applyGlobalFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.globalFilterValue = filterValue.trim().toLowerCase();
  
    this.dataSource.filter = this.globalFilterValue;
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
  
    this.totalMobilityPercentage = totalDaysInHospital > 0
      ? (totalDatesWithBothShifts / totalDaysInHospital) * 100
      : 0;
  
    console.log('Total Mobility Percentage:', this.totalMobilityPercentage);
  
    this.gaugeValue = this.totalMobilityPercentage; // Reuse the same value for the gauge
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
    cognitiveStates: string[]; 
    mobilityStates: string[];
    basicStates: string[];
    consultationStatuses: string[];
  }>();

  this.dataSource.data.forEach(item => {
    const unitName = item.UnitName || 'Unknown';
    const mobilityGrade = item.MobilityGrade;
    const recommendation = item.RecommendationForWalking;
    const cognitive = item.CognitiveFunctionBeforeHospitalization;
    const mobility = item.MobilityBeforeHospitalization;
    const basic = item.BasicFunctionBeforeHospitalization;
    const consultationStatus = item.ConsultationStatus;
    const departmentPercentages = this.calculateDepartmentPercentages();

    if (!departmentMap.has(unitName)) {
      departmentMap.set(unitName, { 
        totalShifts: 0, 
        totalDays: 0, 
        mobilityGrades: [], 
        recommendations: [], 
        cognitiveStates: [], 
        mobilityStates: [],
        basicStates: [],
        consultationStatuses: []
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

    department.cognitiveStates.push(cognitive);
    department.mobilityStates.push(mobility);
    department.basicStates.push(basic);

    if (consultationStatus !== 'Grade X - Not for Filter') {
      department.consultationStatuses.push(consultationStatus);
    }
  });

  const departmentPercentages = Array.from(departmentMap.entries()).map(([unitName, data]) => ({
    unitName,
    percentage: data.totalDays > 0 ? (data.totalShifts / data.totalDays) * 100 : 0,
    mobilityGrades: data.mobilityGrades,
    recommendations: data.recommendations,
    cognitiveStates: data.cognitiveStates,
    mobilityStates: data.mobilityStates,
    basicStates: data.basicStates,
    consultationStatuses: data.consultationStatuses
  }));

  const totalMobilityPercentage = this.departmentPercentages.reduce((sum, dept) => sum + dept.percentage, 0) / this.departmentPercentages.length;

  this.dialog.open(DepartmentPercentagesDialogComponent, {
    width: '1200px',
    data: { 
      percentages: departmentPercentages,
      totalMobilityPercentage: this.totalMobilityPercentage, // Pass the same value
    },
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
toggleView(): void {
  this.showGraph = !this.showGraph;

  if (this.showGraph) {
    console.log('Switching to graph view');
    this.prepareChartData();
    setTimeout(() => this.initializeChart()); // Initialize chart after DOM updates
  } else {
    console.log('Switching back to table view');

    // ✅ Reassign paginator and sort after view switch
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }
}


initializeChartData(): void {
  // Generate chart data for mobility grades
  const gradeCounts = new Map<string, number>();

  this.dataSource.data.forEach((item) => {
    const grade = item.MobilityGrade || 'אין תיעוד'; // Default value
    gradeCounts.set(grade, (gradeCounts.get(grade) || 0) + 1);
  });

  this.mobilityGradeChartData = Array.from(gradeCounts.entries()).map(([name, value]) => ({
    name,
    value,
  }));

  console.log('Chart Data Initialized:', this.mobilityGradeChartData);
}
public chart: Chart | null = null;
public chartData: ChartData<'pie'> = {
  labels: [], // Labels for your pie chart
  datasets: [
    {
      label: 'Mobility Grades Distribution',
      data: [], // Data for the pie chart
      backgroundColor: [], // Array of colors for each segment
      borderColor: [], // Array of border colors for each segment
      borderWidth: 1,
    },
  ],
};
public chartType: ChartType = 'pie';
public chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const, // Explicitly specify the type to match
    },
    tooltip: {
      enabled: true, // Enable tooltips
    },
  },
};

initializeChart(): void {
  if (!this.chartCanvas || !this.chartCanvas.nativeElement) {
    console.warn('Chart canvas is not available yet. Retrying...');
    setTimeout(() => this.initializeChart(), 100); // Retry after a short delay
    return;
  }

  if (this.chart) {
    this.chart.destroy(); // Destroy any existing chart instance
  }

  const ctx = this.chartCanvas.nativeElement.getContext('2d');
  if (ctx) {
    const colors = [
      '#4CAF50', // Green
      '#2196F3', // Blue
      '#FFC107', // Yellow
      '#FF5722', // Orange
      '#9C27B0', // Purple
      '#E91E63', // Pink
      '#607D8B', // Grey
    ];

    const borderColors = colors.map(color => `${color}CC`); // Add transparency

    this.chart = new Chart(ctx, {
      type: this.chartType,
      data: {
        labels: this.chartData.labels,
        datasets: [
          {
            label: 'Mobility Grades Distribution',
            data: this.chartData.datasets[0].data,
            backgroundColor: colors,
            borderColor: borderColors,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top', // Legend at the top
            labels: {
              font: {
                size: 14, // Larger font size for better visibility
                family: 'Arial, sans-serif',
              },
              color: '#444444', // Darker text for better contrast
            },
          },
          tooltip: {
            enabled: true,
            backgroundColor: '#FFFFFF', // White background for tooltip
            titleColor: '#000000', // Black title text
            bodyColor: '#333333', // Dark body text
            borderColor: '#CCCCCC',
            borderWidth: 1,
          },
        },
        layout: {
          padding: 20, // Add padding around the chart
        },
        scales: {
          x: {
            display: false, // Hide x-axis since it's a pie chart
          },
          y: {
            display: false, // Hide y-axis since it's a pie chart
          },
        },
      },
    });
  }
}




prepareChartData(): void {
  const gradeCounts = new Map<string, number>();
  const tags = ['Low', 'Medium', 'High', 'Unknown']; // Example tags for categories

  this.dataSource.data.forEach((item) => {
    const grade = item.MobilityGrade || 'Unknown'; // Default for missing grades
    gradeCounts.set(grade, (gradeCounts.get(grade) || 0) + 1);
  });

  const labelsWithTags = Array.from(gradeCounts.keys()).map((label, index) => {
    const tag = tags[index % tags.length]; // Assign tags in a loop
    return `${label} (${tag})`; // Append the tag to the label
  });

  this.chartData.labels = labelsWithTags; // Labels with tags
  this.chartData.datasets[0].data = Array.from(gradeCounts.values());
  this.chartData.datasets[0].backgroundColor = [
    '#4CAF50', '#2196F3', '#FFC107', '#FF5722', '#9C27B0', '#E91E63', '#607D8B',
  ];
}

}
