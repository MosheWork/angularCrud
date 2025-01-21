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
  isGraphVisible: boolean = false;

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
  dailyFollowUpDataSource: MatTableDataSource<any>;
  anamnesisResultsDataSource: MatTableDataSource<any>;
  fullListDataSource: MatTableDataSource<any>;


  dailyFollowUpColumns: string[] = ['EmployeeName', 'SimpleA', 'ComplexB', 'VeryComplexC', 'GroupD'];
  anamnesisResultsColumns: string[] = ['Code', 'EmployeeName', 'Simple', 'Complex', 'VeryComplex'];
  fullListColumns: string[] = ['Subject', 'EntryDate', 'Heading', 'IdNum', 'FirstName', 'LastName'];

  filterForm: FormGroup;
  availableYears: number[] = [2023, 2024, 2025];
  availableMonths: number[] = Array.from({ length: 12 }, (_, i) => i + 1);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.dailyFollowUpDataSource = new MatTableDataSource<any>([]);
    this.anamnesisResultsDataSource = new MatTableDataSource<any>([]);
    this.fullListDataSource = new MatTableDataSource<any>([]);

    this.filterForm = this.fb.group({
      year: new FormControl(new Date().getFullYear()),
      month: new FormControl(new Date().getMonth() + 1),
    });
  }

  ngOnInit(): void {
    this.fetchDailyFollowUpData();
    this.fetchAnamnesisResultsData();
    this.fetchFullListDailyFollowUp();

  }

  fetchFullListDailyFollowUp(): void {
    this.loading = true;
    this.http.get<any[]>(`${environment.apiUrl}CommunicationTherapist/FullListDailyFollowUp`).subscribe(
      (data) => {
        this.fullListDataSource.data = data;
        this.fullListDataSource.paginator = this.paginator;
        this.fullListDataSource.sort = this.sort;
        this.loading = false;
      },
      (error) => {
        console.error('Error fetching full list daily follow-up data:', error);
        this.loading = false;
      }
    );
  }
  fetchDailyFollowUpData(): void {
    this.loading = true;
    const { year, month } = this.filterForm.value;

    this.http
      .get<any[]>(`${environment.apiUrl}CommunicationTherapist/V_DailyFollowUp`, {
        params: { year, month },
      })
      .subscribe(
        (data) => {
          this.dailyFollowUpDataSource.data = data;
          this.dailyFollowUpDataSource.paginator = this.paginator;
          this.dailyFollowUpDataSource.sort = this.sort;
          this.loading = false;
        },
        (error) => {
          console.error('Error fetching daily follow-up data:', error);
          this.loading = false;
        }
      );
  }

  fetchAnamnesisResultsData(): void {
    this.loading = true;
    const { year, month } = this.filterForm.value;

    this.http
      .get<any[]>(`${environment.apiUrl}CommunicationTherapist/AnamnesisResults`, {
        params: { year, month },
      })
      .subscribe(
        (data) => {
          this.anamnesisResultsDataSource.data = data;
          this.anamnesisResultsDataSource.paginator = this.paginator;
          this.anamnesisResultsDataSource.sort = this.sort;
          this.loading = false;
        },
        (error) => {
          console.error('Error fetching anamnesis results data:', error);
          this.loading = false;
        }
      );
  }

  applyFilters(): void {
    this.fetchDailyFollowUpData();
    this.fetchAnamnesisResultsData();
  }

  resetFilters(): void {
    this.filterForm.reset({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    });
    this.applyFilters();
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
