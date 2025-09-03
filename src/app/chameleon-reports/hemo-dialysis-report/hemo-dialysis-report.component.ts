import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
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
  totalResults = 0;
  titleUnit = 'HemoDialysis SOS Report';
  Title1 = 'Total Results: ';
  Title2 = '';

  showGraph = false;
  isGraphVisible = false;

  // 🔑 Expect lower-first keys from backend
  columns: string[] = ['entryDate', 'hemoDialysisIndicationText', 'idNum', 'admissionNo', 'firstName', 'lastName'];

  dataSource: any[] = [];
  filteredData: any[] = [];
  matTableDataSource: MatTableDataSource<any>;
  filterForm: FormGroup;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

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
  public chartOptions = { responsive: true };

  constructor(private http: HttpClient, private fb: FormBuilder, private router: Router) {
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
    Chart.register(...registerables);
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
      // ⬇️ Use data as-is (expects lower-first keys)
      this.dataSource = data || [];
      this.filteredData = [...this.dataSource];

      this.matTableDataSource = new MatTableDataSource(this.filteredData);
      this.matTableDataSource.paginator = this.paginator;
      this.matTableDataSource.sort = this.sort;

      this.applyFilters();
      this.updateChartData('PerHemoDialysis');
    });
  }

  private createFilterForm(): FormGroup {
    return this.fb.group({
      entryDate: new FormControl(''),
      hemoDialysisIndication: new FormControl(''),
      idNum: new FormControl(''),
      admissionNo: new FormControl(''),
      firstName: new FormControl(''),
      lastName: new FormControl(''),
      startEntryDate: new FormControl(''),
      endEntryDate: new FormControl(''),
      globalFilter: new FormControl('')
    });
  }

  applyFilters() {
    const filters = this.filterForm.value;
    const globalFilterValue = (filters.globalFilter || '').toLowerCase();

    this.filteredData = this.dataSource.filter((item) => {
      const matchesGlobalFilter = Object.values(item).some(val =>
        val?.toString().toLowerCase().includes(globalFilterValue)
      );
      return matchesGlobalFilter;
    });

    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData.slice();
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
      this.updateChartData('PerHemoDialysis');
      setTimeout(() => this.initializeChart(this.allTimeChartCanvas.nativeElement));
    }
  }

  updateChartData(selectedRange: 'PerHemoDialysis' | 'CountPerDayOrWeekend') {
    let endpoint: string;

    switch (selectedRange) {
      case 'PerHemoDialysis':
        endpoint = `${environment.apiUrl}HemoDialysisSOS/PerHemoDialysisIndication`;
        break;
      case 'CountPerDayOrWeekend':
        endpoint = `${environment.apiUrl}HemoDialysisSOS/CountPerDayOrWeekend`;
        break;
    }

    this.http.get<any>(endpoint).subscribe((data) => {
      const labels: string[] = [];
      const counts: number[] = [];
      const colors: string[] = [];
      const borderColors: string[] = [];

      if (selectedRange === 'PerHemoDialysis' && Array.isArray(data)) {
        // Expect lower-first keys from backend
        data.forEach((item: any) => {
          labels.push(item.hemoDialysisIndicationText);
          counts.push(item.indicationCount);
          colors.push(`rgba(${Math.floor(Math.random()*255)}, ${Math.floor(Math.random()*255)}, ${Math.floor(Math.random()*255)}, 0.2)`);
          borderColors.push(`rgba(${Math.floor(Math.random()*255)}, ${Math.floor(Math.random()*255)}, ${Math.floor(Math.random()*255)}, 1)`);
        });
      }

      if (selectedRange === 'CountPerDayOrWeekend' && data && !Array.isArray(data)) {
        const sunThuCount = data.sunThuCount ?? 0;
        const friSatCount = data.friSatCount ?? 0;

        labels.push('ראשון-חמישי', 'שישי-שבת');
        counts.push(sunThuCount, friSatCount);

        colors.push('rgba(75, 192, 192, 0.2)', 'rgba(255, 99, 132, 0.2)');
        borderColors.push('rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)');
      }

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

    switch (event.index) {
      case 0:
        canvas = this.allTimeChartCanvas.nativeElement;
        this.updateChartData('PerHemoDialysis');
        break;
      case 1:
        canvas = this.yearlyChartCanvas.nativeElement;
        this.updateChartData('CountPerDayOrWeekend');
        break;
      default:
        return;
    }

    this.initializeChart(canvas);
  }

  initializeChart(canvas: HTMLCanvasElement) {
    if (this.chart) this.chart.destroy();

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth * 0.9;
    canvas.height = window.innerHeight * 0.5;

    this.chart = new Chart(ctx, {
      type: this.chartType,
      data: this.chartData,
      options: {
        ...this.chartOptions,
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: 10 },
        plugins: {
          legend: { position: 'top' },
          tooltip: { enabled: true },
        },
        scales: {
          x: { display: true, title: { display: true, text: 'Indications' } },
          y: { display: true, title: { display: true, text: 'Count' }, beginAtZero: true },
        },
      },
    });
  }

  goToHome() {
    this.router.navigate(['/MainPageReports']);
  }
}
