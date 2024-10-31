import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { Chart, ChartData, ChartType, registerables } from 'chart.js';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-hemo-dialysis-report',
  templateUrl: './hemo-dialysis-report.component.html',
  styleUrls: ['./hemo-dialysis-report.component.scss']
})
export class HemoDialysisReportComponent implements OnInit, AfterViewInit {
  totalResults: number = 0;
  titleUnit: string = 'HemoDialysis SOS Report';
  Title1: string = 'Total Results: ';
  Title2: string = '';

  showGraph: boolean = false;
  isGraphVisible: boolean = false;

  columns: string[] = ['EntryDate','HemoDialysisIndicationText', 'IdNum', 'AdmissionNo', 'FirstName', 'LastName'];
  dataSource: any[] = [];
  filteredData: any[] = [];
  matTableDataSource: MatTableDataSource<any>;
  filterForm: FormGroup;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // References to each chart's canvas
  @ViewChild('monthlyChartCanvas') monthlyChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('yearlyChartCanvas') yearlyChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('allTimeChartCanvas') allTimeChartCanvas!: ElementRef<HTMLCanvasElement>;

  public chart: Chart | null = null;
  public chartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      label: 'HemoDialysis Indications Count',
      data: [],
      backgroundColor: [],
      borderColor: [],
      borderWidth: 1,
    }]
  };
  public chartType: ChartType = 'bar';
  public chartOptions = {
    responsive: true,
  };

  constructor(private http: HttpClient, private fb: FormBuilder, private router: Router) {
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
    Chart.register(...registerables);  // Register Chart.js components
  }

  ngOnInit() {
    this.fetchHemoDialysisData();
  }

  ngAfterViewInit() {
    if (this.showGraph) {
      this.initializeChart(this.allTimeChartCanvas.nativeElement);
    }
  }

  fetchHemoDialysisData() {
    this.http.get<any[]>(`${environment.apiUrl}HemoDialysisSOS`).subscribe((data) => {
      this.dataSource = data;
      this.filteredData = [...data];
      this.matTableDataSource = new MatTableDataSource(this.filteredData);
      this.matTableDataSource.paginator = this.paginator;
      this.matTableDataSource.sort = this.sort;
      this.applyFilters();
      this.updateChartData('PerHemoDialysis');    });
  }

  private createFilterForm(): FormGroup {
    return this.fb.group({
      EntryDate: new FormControl(''),
      HemoDialysisIndication: new FormControl(''),
      IdNum: new FormControl(''),
      AdmissionNo: new FormControl(''),
      FirstName: new FormControl(''),
      LastName: new FormControl(''),
      startEntryDate: new FormControl(''),
      endEntryDate: new FormControl(''),
      globalFilter: new FormControl('')
    });
  }

  applyFilters() {
    const filters = this.filterForm.value;
    const globalFilterValue = filters.globalFilter?.toLowerCase() || '';

    this.filteredData = this.dataSource.filter((item) => {
      const matchesGlobalFilter = Object.values(item).some(val => val?.toString().toLowerCase().includes(globalFilterValue));
      return matchesGlobalFilter;
    });

    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
    this.matTableDataSource.paginator = this.paginator;
  }

  resetFilters() {
    this.filterForm.reset();
    this.applyFilters();
  }

  exportToExcel() {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filteredData);
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'hemodialysis_report.xlsx';
    link.click();
  }

  toggleGraphView() {
    this.showGraph = !this.showGraph;
    if (this.showGraph) {
      this.updateChartData('PerHemoDialysis');      setTimeout(() => {
        this.initializeChart(this.allTimeChartCanvas.nativeElement);
      });
    }
  }

  updateChartData(selectedRange: 'PerHemoDialysis' | 'CountPerDayOrWeekend') {
    let endpoint: string;
  
    // Determine the endpoint based on the selected range
    switch (selectedRange) {
      case 'PerHemoDialysis':
        endpoint = `${environment.apiUrl}HemoDialysisSOS/PerHemoDialysisIndication`;
        break;
      case 'CountPerDayOrWeekend':
        endpoint = `${environment.apiUrl}HemoDialysisSOS/CountPerDayOrWeekend`;
        break;
      default:
        return;
    }
  
    // Make the HTTP request to the appropriate endpoint
    this.http.get<any>(endpoint).subscribe((data) => {
      const labels = [];
      const counts = [];
      const colors = [];  // Background color array for each bar
      const borderColors = []; // Border color array for each bar
  
      // Populate data for PerHemoDialysis graph
      if (selectedRange === 'PerHemoDialysis') {
        data.forEach((item: any) => {
          labels.push(item.HemoDialysisIndicationText); // Use HemoDialysisIndicationText for labels
          counts.push(item.IndicationCount);
          
          // Add random colors for each bar
          colors.push(`rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.2)`);
          borderColors.push(`rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 1)`);
        });
      } else if (selectedRange === 'CountPerDayOrWeekend') {
        // Populate data for CountPerDayOrWeekend graph
        const sunThuCount = data.SunThuCount ?? 0;
        const friSatCount = data.FriSatCount ?? 0;
  
        labels.push('ראשון-חמישי', 'שישי-שבת');
        counts.push(sunThuCount, friSatCount);
  
        // Set specific colors for Sun-Thu and Fri-Sat
        colors.push('rgba(75, 192, 192, 0.2)', 'rgba(255, 99, 132, 0.2)');
        borderColors.push('rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)');
      }
  
      // Update the chart data and refresh the chart
      this.chartData.labels = labels;
      this.chartData.datasets[0].data = counts;
      this.chartData.datasets[0].backgroundColor = colors;
      this.chartData.datasets[0].borderColor = borderColors;
      this.chart?.update();
    }, error => {
      console.error('Error fetching chart data:', error);
    });
  }
  
  
  
  

  onTabChanged(event: MatTabChangeEvent): void {
    let canvas: HTMLCanvasElement;
  
    // Clear any existing chart data and choose the correct endpoint based on the tab
    switch (event.index) {
      case 0:  // Tab for HemoDialysis Indications
        canvas = this.allTimeChartCanvas.nativeElement;
        this.updateChartData('PerHemoDialysis');  // Call the PerHemoDialysisIndication endpoint
        break;
      case 1:  // Tab for Counts by Day Type
        canvas = this.yearlyChartCanvas.nativeElement;
        this.updateChartData('CountPerDayOrWeekend');  // Call the CountPerDayOrWeekend endpoint
        break;
      default:
        return;
    }
  
    // Reinitialize the chart with the new canvas and updated data
    this.initializeChart(canvas);
  }
  
  initializeChart(canvas: HTMLCanvasElement) {
    if (this.chart) {
      this.chart.destroy(); // Destroy the existing chart instance before reinitializing
    }
  
    // Get the context and dynamically adjust width and height
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Set canvas dimensions
      canvas.width = window.innerWidth * 0.9; // Adjust width as needed
      canvas.height = window.innerHeight * 0.5; // Adjust height as needed
  
      // Initialize the chart with responsive options
      this.chart = new Chart(ctx, {
        type: this.chartType,
        data: this.chartData,
        options: {
          ...this.chartOptions,
          responsive: true,
          maintainAspectRatio: false, // Allow the chart to fill the container
          layout: {
            padding: 10 // Optional: Adjust padding as needed
          },
          plugins: {
            legend: {
              position: 'top', // Adjust legend placement if needed
            },
            tooltip: {
              enabled: true,
            },
          },
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: 'Indications',
              },
            },
            y: {
              display: true,
              title: {
                display: true,
                text: 'Count',
              },
              beginAtZero: true, // Ensure y-axis starts from zero
            },
          },
        },
      });
    }
  }
  

  goToHome() {
    this.router.navigate(['/MainPageReports']);
  }
}
