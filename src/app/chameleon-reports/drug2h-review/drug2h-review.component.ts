import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import * as XLSX from 'xlsx';
import { Drug2hDetailsComponent } from './drug2h-details/drug2h-details.component';
import { MatDialog } from '@angular/material/dialog';
import { Chart, ChartData, ChartType, registerables } from 'chart.js';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-drug2h-review',
  templateUrl: './drug2h-review.component.html',
  styleUrls: ['./drug2h-review.component.scss'],
})
export class Drug2hReviewComponent implements OnInit, AfterViewInit {
  loading: boolean = false; // Spinner control
  unitNames: string[] = []; // To store unit names
  totalResults: number = 0;
  titleUnit: string = ' דוח בקרת תרופות בנות סיכון';
  Title1: string = 'סה\"כ רשומות: ';
  Title2: string = '';
  public chartType: ChartType = 'bar';
  public chartOptions = {
    responsive: true,
    scales: {
      y: { beginAtZero: true },
    },
  };

  isGraphVisible: boolean = false; // Toggle flag for graph and table
  columns: string[] = [
    'unit_Name',
    'next_Execution_Not_Null',
    'count_Above_2_10H',
    'count_Below_2_10H',
    'percent_Below_2_10H'
    , 'Year', 'Quarter'
  ];
  dataSource: any[] = [];
  filteredData: any[] = [];
  matTableDataSource: MatTableDataSource<any>;
  filterForm: FormGroup;
  bestPerformers: any[] = []; // Top performers
  worstPerformers: any[] = []; // Bottom performers
  gaugeValue: number = 0;
  totalUnits: number = 0;
  totalAbove210: number = 0;
  totalBelow210: number = 0;
  percentBelow210: number = 0;

  availableYears: number[] = [2023, 2024, 2025, 2026];
  availableQuarters: number[] = [1, 2, 3, 4];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('allTimeChartCanvas') allTimeChartCanvas!: ElementRef<HTMLCanvasElement>;

  public chart: Chart | null = null;
  public chartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        label: 'Execution Count',
        data: [],
        backgroundColor: [],
        borderColor: [],
        borderWidth: 1,
      },
    ],
  };

  constructor(private http: HttpClient, private fb: FormBuilder, private dialog: MatDialog) {
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<any>([]); // Initialize table data source
    Chart.register(...registerables); // Register Chart.js components
  }

  ngOnInit(): void {
    this.matTableDataSource.filterPredicate = (data: any, filter: string) => {
      const formattedFilter = filter.trim().toLowerCase();
      return this.columns.some((column) => {
        const columnValue = data[column] ? data[column].toString().toLowerCase() : '';
        return columnValue.includes(formattedFilter);
      });
    };

    this.fetchData();
  }

  ngAfterViewInit(): void {
    this.matTableDataSource.paginator = this.paginator;
    this.matTableDataSource.sort = this.sort;

    this.sort.sortChange.subscribe((sortChange: Sort) => {
      console.log('Sort event triggered:', sortChange);
    });
  }

  private createFilterForm(): FormGroup {
    return this.fb.group({
      year: [[]],
      quarter: [[]],
      unitName: [[]],
      half: [null],
      globalFilter: ['']
    });
  }
  

  applyFilters(): void {
    const filters = this.filterForm.value;
    this.fetchData();
  }
  
  
  

  resetFilters() {
    this.filterForm.reset();
    this.fetchData();
  }

  exportToExcel() {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filteredData);
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'drug2h_review.xlsx';
    link.click();
  }

  fetchData(): void {
    this.loading = true;
  
    const filters = this.filterForm.value;
    const params: any = {};
  
    if (filters.year?.length) {
      params.year = filters.year.join(','); // "2023,2024"
    }
  
    if (filters.quarter?.length) {
      params.quarter = filters.quarter.join(','); // "1,2"
    }
  
    if (filters.unitName?.length) {
      params.unitName = filters.unitName.join(','); // "Cardiology,ICU"
    }
  
    this.http.get<any[]>(`${environment.apiUrl}Drug2hReview`, { params }).subscribe(
      (data) => {
        this.dataSource = data;
        this.matTableDataSource.data = [...this.dataSource];
        this.unitNames = Array.from(new Set(data.map((item) => item.unit_Name))).sort();
        this.updateChartData();
  
        this.bestPerformers = [...this.dataSource]
          .sort((a, b) => b.percent_Below_2_10H - a.percent_Below_2_10H)
          .slice(0, 5);
  
        this.worstPerformers = [...this.dataSource]
          .sort((a, b) => a.percent_Below_2_10H - b.percent_Below_2_10H)
          .slice(0, 5);
  
        this.calculateMetrics();
        this.loading = false;
      },
      (error) => {
        console.error('Error fetching data:', error);
        this.loading = false;
      }
    );
  }
  
  
  
  
  calculateMetrics(): void {
    const filteredData = this.matTableDataSource.data;

    this.totalUnits = filteredData.length;
    this.totalAbove210 = filteredData.reduce((sum, item) => sum + (item.count_Above_2_10H || 0), 0);
    this.totalBelow210 = filteredData.reduce((sum, item) => sum + (item.count_Below_2_10H || 0), 0);

    const totalExecutions = this.totalAbove210 + this.totalBelow210;
    this.percentBelow210 = totalExecutions > 0 ? (this.totalBelow210 / totalExecutions) * 100 : 0;

    this.gaugeValue = this.percentBelow210;
  }

  getGaugeColor(gaugeValue: number): string {
    if (gaugeValue > 80) {
      return '#4caf50'; // Green
    } else if (gaugeValue >= 60) {
      return '#ff9800'; // Orange
    } else {
      return '#f44336'; // Red
    }
  }

  openDrugDetailsDialog(unitName: string): void {
    const filters = this.filterForm.value;
  
    const dialogRef = this.dialog.open(Drug2hDetailsComponent, {
      width: '80%',
      data: {
        Unit_Name: unitName,
        year: filters.year,
        quarter: filters.quarter,
        half: filters.half,
        unitName: filters.unitName
        // Add fromDate/toDate if you have them!
      },
    });
  
    dialogRef.afterClosed().subscribe(() => {
      console.log('Dialog closed');
    });
  }
  
  toggleView(): void {
    this.isGraphVisible = !this.isGraphVisible;
    if (this.isGraphVisible) {
      setTimeout(() => {
        this.initializeChart(this.allTimeChartCanvas.nativeElement);
      });
    }
  }

  updateChartData(): void {
    const labels = this.dataSource.map(item => item.unit_Name); // Unit names
    const data = this.dataSource.map(item => item.percent_Below_2_10H); // Percent_Below_2_10H values

    // Generate unique colors for each department
    const colors = labels.map((_, index) => this.getColor(index));
    const borderColors = labels.map((_, index) => this.getBorderColor(index));

    // Update chart data
    this.chartData.labels = labels;
    this.chartData.datasets[0].data = data;
    this.chartData.datasets[0].backgroundColor = colors;
    this.chartData.datasets[0].borderColor = borderColors;

    // Refresh the chart if it exists
    if (this.chart) {
      this.chart.update();
    }
  }

  initializeChart(canvas: HTMLCanvasElement): void {
    if (this.chart) {
      this.chart.destroy(); // Destroy existing chart
    }

    const ctx = canvas.getContext('2d');
    if (ctx) {
      this.chart = new Chart(ctx, {
        type: this.chartType,
        data: this.chartData,
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => `${value}%`, // Show percentage on Y-axis
              },
            },
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) => `${context.raw}%`, // Show percentage in tooltips
              },
            },
          },
        },
      });
    }
  }

  getColor(index: number): string {
    const colors = [
      'rgba(255, 99, 132, 0.2)',  // Red
      'rgba(54, 162, 235, 0.2)',  // Blue
      'rgba(255, 206, 86, 0.2)',  // Yellow
      'rgba(75, 192, 192, 0.2)',  // Green
      'rgba(153, 102, 255, 0.2)', // Purple
      'rgba(255, 159, 64, 0.2)',  // Orange
      'rgba(99, 255, 132, 0.2)',  // Pink
      'rgba(132, 99, 255, 0.2)',  // Violet
    ];
    return colors[index % colors.length]; // Cycle through colors
  }

  getBorderColor(index: number): string {
    const borderColors = [
      'rgba(255, 99, 132, 1)',  // Red
      'rgba(54, 162, 235, 1)',  // Blue
      'rgba(255, 206, 86, 1)',  // Yellow
      'rgba(75, 192, 192, 1)',  // Green
      'rgba(153, 102, 255, 1)', // Purple
      'rgba(255, 159, 64, 1)',  // Orange
      'rgba(99, 255, 132, 1)',  // Pink
      'rgba(132, 99, 255, 1)',  // Violet
    ];
    return borderColors[index % borderColors.length]; // Cycle through colors
  }
}
