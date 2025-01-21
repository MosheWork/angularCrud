import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { Chart, ChartData, ChartType, registerables } from 'chart.js';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-communication-therapist',
  templateUrl: './communication-therapist.component.html',
  styleUrls: ['./communication-therapist.component.scss'],
})
export class CommunicationTherapistComponent implements OnInit {
  loading: boolean = false;
  isGraphVisible: boolean = false; // Initialize `isGraphVisible`

  // Chart configuration
  chart: Chart | null = null;
  chartType: ChartType = 'bar';
  chartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        label: 'Data Summary',
        data: [],
        backgroundColor: [],
        borderColor: [],
        borderWidth: 1,
      },
    ],
  };

  // Data Sources and Columns
  dailyFollowUpDataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  anamnesisResultsDataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  fullListDataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);

  dailyFollowUpColumns: string[] = ['EmployeeName', 'SimpleA', 'ComplexB', 'VeryComplexC', 'GroupD'];
  anamnesisResultsColumns: string[] = ['Code', 'EmployeeName', 'Simple', 'Complex', 'VeryComplex'];
  fullListColumns: string[] = ['Subject', 'EntryDate', 'Heading', 'IdNum', 'FirstName', 'LastName'];

  // Filters
  filterForm: FormGroup;
  availableYears: number[] = [2023, 2024, 2025];
  months = [
    { name: 'January', value: 1 },
    { name: 'February', value: 2 },
    { name: 'March', value: 3 },
    { name: 'April', value: 4 },
    { name: 'May', value: 5 },
    { name: 'June', value: 6 },
    { name: 'July', value: 7 },
    { name: 'August', value: 8 },
    { name: 'September', value: 9 },
    { name: 'October', value: 10 },
    { name: 'November', value: 11 },
    { name: 'December', value: 12 },
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      year: new FormControl(new Date().getFullYear()), // Default to current year
      month: new FormControl(null), // Default to no month selected
    });

    Chart.register(...registerables); // Register Chart.js components
  }

  ngOnInit(): void {
    this.applyFilters(); // Fetch data for all tables on init
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    const year = filters.year;
    const month = filters.month;

    // Fetch data for all tables
    this.fetchDailyFollowUpData(year, month);
    this.fetchAnamnesisResultsData(year, month);
    this.fetchFullListDailyFollowUp(year, month);
  }

  resetFilters(): void {
    this.filterForm.reset({
      year: new Date().getFullYear(), // Reset to current year
      month: null, // Reset month to null
    });
    this.applyFilters(); // Re-fetch all data with default filters
  }

  fetchDailyFollowUpData(year?: number, month?: number): void {
    this.loading = true;

    const params: any = {};
    if (year) params.year = year;
    if (month) params.month = month;

    this.http
      .get<any[]>(`${environment.apiUrl}CommunicationTherapist/V_DailyFollowUp`, { params })
      .subscribe(
        (data) => {
          this.dailyFollowUpDataSource.data = data;
          this.loading = false;
        },
        (error) => {
          console.error('Error fetching Daily Follow-Up data:', error);
          this.loading = false;
        }
      );
  }

  fetchAnamnesisResultsData(year?: number, month?: number): void {
    this.loading = true;

    const params: any = {};
    if (year) params.year = year;
    if (month) params.month = month;

    this.http
      .get<any[]>(`${environment.apiUrl}CommunicationTherapist/AnamnesisResults`, { params })
      .subscribe(
        (data) => {
          this.anamnesisResultsDataSource.data = data;
          this.loading = false;
        },
        (error) => {
          console.error('Error fetching Anamnesis Results data:', error);
          this.loading = false;
        }
      );
  }

  fetchFullListDailyFollowUp(year?: number, month?: number): void {
    this.loading = true;

    const params: any = {};
    if (year) params.year = year;
    if (month) params.month = month;

    this.http
      .get<any[]>(`${environment.apiUrl}CommunicationTherapist/FullListDailyFollowUp`, { params })
      .subscribe(
        (data) => {
          this.fullListDataSource.data = data;
          this.loading = false;
        },
        (error) => {
          console.error('Error fetching Full List Daily Follow-Up data:', error);
          this.loading = false;
        }
      );
  }

  toggleView(): void {
    this.isGraphVisible = !this.isGraphVisible;
    if (this.isGraphVisible) {
      this.initializeChart();
    }
  }

  initializeChart(): void {
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (ctx) {
      this.chart = new Chart(ctx, {
        type: this.chartType,
        data: this.chartData,
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true },
          },
        },
      });
    }
  }
}
