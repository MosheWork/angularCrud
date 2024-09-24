import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';  // For Excel export
import { Chart, ChartData, ChartType, registerables } from 'chart.js'; // For Charts
import { MatTabChangeEvent } from '@angular/material/tabs';  // Import for tab change event
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-senior-doctor-not-sighned',
  templateUrl: './senior-doctor-not-sighned-component.component.html',
  styleUrls: ['./senior-doctor-not-sighned-component.component.scss']
})
export class SeniorDoctorNotSighnedComponent implements OnInit, AfterViewInit {
  totalResults: number = 0;
  titleUnit: string = 'דוח רופאים בכירים שלא חתמו ';
  Title1: string = ' סה"כ תוצאות: ';
  Title2: string = '';

  showGraph: boolean = false; // Toggle between table and graph
  isGraphVisible: boolean = false; // Flag to toggle the graph icon

  columns: string[] = [
    'FirstName',
    'LastName',
    'MedicalRecord',
    'SystemUnitName',
    'Duty',
    'Field',
    'EntryDate',
    'EntryUser',
    'AdmissionNo',
    'FunctionID',
    'FunctionDescription',
    'IsInFunctionList'
  ];

  dataSource: any[] = [];
  filteredData: any[] = [];
  matTableDataSource: MatTableDataSource<any>;
  filterForm: FormGroup;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Reference to each chart's canvas
  @ViewChild('monthlyChartCanvas') monthlyChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('quarterlyChartCanvas') quarterlyChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('yearlyChartCanvas') yearlyChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('allTimeChartCanvas') allTimeChartCanvas!: ElementRef<HTMLCanvasElement>;

  // Chart variables
  public chart: Chart | null = null;
  public chartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      label: 'System Unit Count',
      data: [],
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1,
    }]
  };
  public chartType: ChartType = 'bar';
  public chartOptions = {
    responsive: true
  };

  constructor(private http: HttpClient, private fb: FormBuilder, private router: Router) {
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
    Chart.register(...registerables); // Register Chart.js components
  }

  ngOnInit() {
    this.http.get<any[]>(environment.apiUrl + 'seniorDoctorNotSighned').subscribe((data) => {
        this.dataSource = data;
        this.filteredData = [...data];
        this.matTableDataSource = new MatTableDataSource(this.filteredData);
        this.matTableDataSource.paginator = this.paginator;
        this.matTableDataSource.sort = this.sort;

        this.columns.forEach((column) => {
            this.filterForm.get(column)?.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => this.applyFilters());
        });

        this.filterForm.valueChanges.subscribe(() => {
            this.applyFilters();
            this.paginator.firstPage();
        });

        this.applyFilters();
        this.updateChartData('all'); // Initialize chart data with the 'all' range
    });
}

  ngAfterViewInit() {
    // This will ensure that all the canvas elements are available before initializing any charts
    if (this.showGraph) {
      this.initializeChart(this.monthlyChartCanvas.nativeElement);
    }
  }

  private createFilterForm(): FormGroup {
    return this.fb.group({
      FirstName: new FormControl(''),
      LastName: new FormControl(''),
      MedicalRecord: new FormControl(''),
      SystemUnitName: new FormControl(''),
      Duty: new FormControl(''),
      Field: new FormControl(''),
      EntryDateStart: new FormControl(''),
      EntryDateEnd: new FormControl(''),
      globalFilter: new FormControl('') // Add globalFilter here
    });
  }

  applyFilters() {
    const filters = this.filterForm.value;
    const globalFilterValue = filters.globalFilter ? filters.globalFilter.toLowerCase() : '';
  
    this.filteredData = this.dataSource.filter((item) => {
      const matchesFirstName = !filters.FirstName || item.FirstName.toLowerCase().includes(filters.FirstName.toLowerCase());
      const matchesLastName = !filters.LastName || item.LastName.toLowerCase().includes(filters.LastName.toLowerCase());
      const matchesMedicalRecord = !filters.MedicalRecord || item.MedicalRecord.includes(filters.MedicalRecord);
      const matchesSystemUnitName = !filters.SystemUnitName || item.SystemUnitName.toLowerCase().includes(filters.SystemUnitName.toLowerCase());
      const matchesDuty = !filters.Duty || item.Duty.toLowerCase().includes(filters.Duty.toLowerCase());
      const matchesField = !filters.Field || item.Field.toString().includes(filters.Field);
  
      const entryDate = new Date(item.EntryDate);
      const matchesEntryDateStart = !filters.EntryDateStart || entryDate >= new Date(filters.EntryDateStart);
      const entryDateEnd = filters.EntryDateEnd ? new Date(filters.EntryDateEnd) : null;
      if (entryDateEnd) {
        entryDateEnd.setHours(23, 59, 59, 999);
      }
      const matchesEntryDateEnd = !filters.EntryDateEnd || (entryDateEnd && entryDate <= entryDateEnd);
      const matchesGlobalFilter = !globalFilterValue || 
        Object.values(item).some(val => val && val.toString().toLowerCase().includes(globalFilterValue));
  
      return matchesFirstName && matchesLastName && matchesMedicalRecord && matchesSystemUnitName && matchesDuty && matchesField && matchesEntryDateStart && matchesEntryDateEnd && matchesGlobalFilter;
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
    link.download = 'senior_doctor_not_sighned.xlsx';
    link.click();
  }

  navigateToGraphPage() {
    this.isGraphVisible = !this.isGraphVisible; // Toggle the flag
    this.showGraph = !this.showGraph;
  
    if (this.showGraph) {
      // Update chart data based on the default range (or you can track the currently selected range)
      this.updateChartData('all'); // Adjust 'all' if you need a different default range
  
      // Wait for Angular to fully render the view before trying to initialize the chart
      setTimeout(() => {
        if (this.allTimeChartCanvas) {
          this.initializeChart(this.allTimeChartCanvas.nativeElement); // Initialize the chart with the default canvas (allTime)
        }
      });
    }
  }
  
  
  

  updateChartData(selectedRange: 'monthly' |  'yearly' | 'all') {
    const systemUnitCounts: { [key: string]: number } = {};
  
    // Get the current date
    const now = new Date();
  
    // Filter the data based on the selected range (monthly, quarterly, yearly, all)
    const filteredByTimeData = this.filteredData.filter(item => {
        const entryDate = new Date(item.EntryDate);
  
        switch (selectedRange) {
            case 'monthly':
                return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
            // case 'quarterly':
            //     const currentQuarter = Math.floor(now.getMonth() / 3);
            //     const itemQuarter = Math.floor(entryDate.getMonth() / 3);
            //     return itemQuarter === currentQuarter && entryDate.getFullYear() === now.getFullYear();
            case 'yearly':
                return entryDate.getFullYear() === now.getFullYear();
            case 'all':
                return true;
        }
    });
  
    // Count occurrences of each SystemUnitName
    filteredByTimeData.forEach(item => {
        const systemUnitName = item.SystemUnitName;
        if (systemUnitCounts[systemUnitName]) {
            systemUnitCounts[systemUnitName]++;
        } else {
            systemUnitCounts[systemUnitName] = 1;
        }
    });
  
    // Prepare color arrays with distinct colors for each bar
    const colors = [
      'rgba(255, 99, 132, 0.2)',   // Red
      'rgba(54, 162, 235, 0.2)',   // Blue
      'rgba(255, 206, 86, 0.2)',   // Yellow
      'rgba(75, 192, 192, 0.2)',   // Green
      'rgba(153, 102, 255, 0.2)',  // Purple
      'rgba(255, 159, 64, 0.2)',   // Orange
      'rgba(255, 99, 132, 0.2)',   // Pink
      'rgba(54, 162, 235, 0.2)',   // Light Blue
      'rgba(255, 206, 86, 0.2)',   // Light Yellow
      'rgba(75, 192, 192, 0.2)',   // Light Green
      'rgba(192, 75, 75, 0.2)',    // Dark Red
      'rgba(162, 54, 235, 0.2)',   // Violet
      'rgba(86, 255, 99, 0.2)',    // Neon Green
      'rgba(192, 192, 75, 0.2)',   // Olive Green
      'rgba(102, 255, 255, 0.2)',  // Aqua
      'rgba(159, 255, 64, 0.2)',   // Lime
      'rgba(132, 99, 255, 0.2)',   // Lavender
      'rgba(99, 255, 235, 0.2)',   // Turquoise
      'rgba(206, 255, 132, 0.2)',  // Pastel Yellow
      'rgba(192, 255, 75, 0.2)',   // Light Olive
      'rgba(255, 102, 192, 0.2)',  // Light Pink
      'rgba(255, 230, 99, 0.2)',   // Pale Yellow
      'rgba(255, 255, 99, 0.2)',   // Soft Yellow
      'rgba(255, 128, 0, 0.2)',    // Deep Orange
      'rgba(64, 255, 255, 0.2)',   // Sky Blue
      'rgba(192, 64, 255, 0.2)',   // Light Purple
      'rgba(64, 128, 255, 0.2)',   // Bright Blue
      'rgba(255, 192, 64, 0.2)',   // Creamy Orange
      'rgba(99, 206, 255, 0.2)',   // Light Blue Sky
      'rgba(128, 192, 255, 0.2)'   // Cool Blue
    ];

    const borderColors = [
      'rgba(255, 99, 132, 1)',   // Red
      'rgba(54, 162, 235, 1)',   // Blue
      'rgba(255, 206, 86, 1)',   // Yellow
      'rgba(75, 192, 192, 1)',   // Green
      'rgba(153, 102, 255, 1)',  // Purple
      'rgba(255, 159, 64, 1)',   // Orange
      'rgba(255, 99, 132, 1)',   // Pink
      'rgba(54, 162, 235, 1)',   // Light Blue
      'rgba(255, 206, 86, 1)',   // Light Yellow
      'rgba(75, 192, 192, 1)',   // Light Green
      'rgba(192, 75, 75, 1)',    // Dark Red
      'rgba(162, 54, 235, 1)',   // Violet
      'rgba(86, 255, 99, 1)',    // Neon Green
      'rgba(192, 192, 75, 1)',   // Olive Green
      'rgba(102, 255, 255, 1)',  // Aqua
      'rgba(159, 255, 64, 1)',   // Lime
      'rgba(132, 99, 255, 1)',   // Lavender
      'rgba(99, 255, 235, 1)',   // Turquoise
      'rgba(206, 255, 132, 1)',  // Pastel Yellow
      'rgba(192, 255, 75, 1)',   // Light Olive
      'rgba(255, 102, 192, 1)',  // Light Pink
      'rgba(255, 230, 99, 1)',   // Pale Yellow
      'rgba(255, 255, 99, 1)',   // Soft Yellow
      'rgba(255, 128, 0, 1)',    // Deep Orange
      'rgba(64, 255, 255, 1)',   // Sky Blue
      'rgba(192, 64, 255, 1)',   // Light Purple
      'rgba(64, 128, 255, 1)',   // Bright Blue
      'rgba(255, 192, 64, 1)',   // Creamy Orange
      'rgba(99, 206, 255, 1)',   // Light Blue Sky
      'rgba(128, 192, 255, 1)'   // Cool Blue
    ];
    const labels = Object.keys(systemUnitCounts);
    const data = Object.values(systemUnitCounts);
  
    // Update chart labels and data with different colors
    this.chartData.labels = labels;
    this.chartData.datasets[0].data = data;
    this.chartData.datasets[0].backgroundColor = colors.slice(0, labels.length); // Assign colors based on the number of bars
    this.chartData.datasets[0].borderColor = borderColors.slice(0, labels.length); // Assign border colors
    
    // Update the chart if it's already initialized
    if (this.chart) {
        this.chart.update();
    }
  }
  

onTabChanged(event: MatTabChangeEvent): void {
  let canvas: HTMLCanvasElement | undefined;

  switch (event.index) {
      case 0: // All Time
          canvas = this.allTimeChartCanvas.nativeElement;
          this.updateChartData('all');
          break;
      case 1: // Yearly
          canvas = this.yearlyChartCanvas.nativeElement;
          this.updateChartData('yearly');
          break;
      // case 2: // Quarterly
      //     canvas = this.quarterlyChartCanvas.nativeElement;
      //     this.updateChartData('quarterly');
      //     break;
      case 2: // Monthly
          canvas = this.monthlyChartCanvas.nativeElement;
          this.updateChartData('monthly');
          break;
      default:
          canvas = this.allTimeChartCanvas.nativeElement;
          this.updateChartData('all');
  }

  if (canvas) {
      this.initializeChart(canvas); // Re-initialize the chart with the selected canvas
  }
}


initializeChart(canvas: HTMLCanvasElement) {  // Initialize the Chart.js chart with the provided canvas
  if (this.chart) {
      this.chart.destroy(); // Destroy existing chart before creating a new one
  }

  const ctx = canvas.getContext('2d');

  if (ctx) {
      this.chart = new Chart(ctx, {
          type: this.chartType,
          data: this.chartData,
          options: this.chartOptions
      });
  }
}


  goToHome() {
    this.router.navigate(['/MainPageReports']);
  }
}
