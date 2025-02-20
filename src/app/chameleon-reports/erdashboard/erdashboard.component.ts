import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import { environment } from '../../../environments/environment';

@Component({

  selector: 'app-erdashboard',
  templateUrl: './erdashboard.component.html',
  styleUrls: ['./erdashboard.component.scss']
})
export class ERdashboardComponent implements OnInit {
  filterForm: FormGroup;
  recordCountByWeekday: any[] = [];
  recordCountByHour: any[] = [];
  isLoading = false;

  // Graph Properties
  view: [number, number] = [700, 400]; // Size of the chart
  gradient = false;
  showXAxis = true;
  showYAxis = true;
  showXAxisLabel = true;
  showYAxisLabel = true;
  yAxisLabel = 'Record Count';

  weekdayChartData: any[] = [];
  hourChartData: any[] = [];

  // Chart Configurations
  public barChartOptions: ChartOptions = {
    responsive: true,
  };

  public barChartType: ChartType = 'bar';

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      startDate: [new Date(new Date().setDate(new Date().getDate() - 7))],
      endDate: [new Date()]
    });
  }

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    this.isLoading = true;

    const startDate = this.formatDate(this.filterForm.value.startDate);
    const endDate = this.formatDate(this.filterForm.value.endDate);

    // Fetch Record Count by Weekday
    this.http.get<any[]>(`${environment.apiUrl}ERInfo/RecordCountByWeekday?startDate=${startDate}&endDate=${endDate}`)
      .subscribe(data => {
        this.recordCountByWeekday = data;
        this.updateWeekdayChart(data);
        this.isLoading = false;
      }, error => {
        console.error('Error fetching weekday data', error);
        this.isLoading = false;
      });

    // Fetch Record Count by Hour
    this.http.get<any[]>(`${environment.apiUrl}ERInfo/RecordCountByHour?startDate=${startDate}&endDate=${endDate}`)
      .subscribe(data => {
        this.recordCountByHour = data;
        this.updateHourChart(data);
        this.isLoading = false;
      }, error => {
        console.error('Error fetching hour data', error);
        this.isLoading = false;
      });
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  resetFilters(): void {
    this.filterForm.reset({
      startDate: new Date(new Date().setDate(new Date().getDate() - 7)),
      endDate: new Date()
    });
    this.fetchData();
  }

  updateWeekdayChart(data: any[]): void {
    this.weekdayChartData = data.map(d => ({
      name: d.Weekday,
      value: d.RecordCount
    }));
  }

  updateHourChart(data: any[]): void {
    this.hourChartData = data.map(d => ({
      name: d.HourRange,
      value: d.RecordCount
    }));
  }
}
