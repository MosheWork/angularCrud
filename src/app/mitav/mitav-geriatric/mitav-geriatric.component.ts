import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { environment } from '../../../environments/environment';
import * as XLSX from 'xlsx';
import { NgxGaugeModule } from 'ngx-gauge';

@Component({
  selector: 'app-mitav-geriatric',
  templateUrl: './mitav-geriatric.component.html',
  styleUrls: ['./mitav-geriatric.component.scss'],
})
export class MitavGeriatricComponent implements OnInit {
  title: string = 'דאשבורד גריאטריה ';
  totalResults: number = 0;
  isLoading: boolean = true;
  dataSource: MatTableDataSource<any> = new MatTableDataSource();
  unitOptions: string[] = [];
  filteredPercentage: number = 0;
  validGeriatricCount: number = 0;
  invalidGeriatricCount: number = 0;
  totalGeriatricCases: number = 0;
  geriatricAssessmentGauge: number = 0;
  // Additional gauges
delayUnder24hPercentage: number = 0;
delay24to48hPercentage: number = 0;
delayOver48hPercentage: number = 0;
under24Count: number = 0;
from24to48Count: number = 0;
over48Count: number = 0;
  displayedColumns: string[] = [
    'ATD_Admission_Date', 'Admission_No', 'Age_Years', 'PrimaryUnit_Name', 'GeriatricConsultation',
    'GeriatricConsultationOpenDate','Answer_Date','AnswerDelayInHours'

  ];

  columnLabels: { [key: string]: string } = {
    ATD_Admission_Date: 'תאריך קבלה',
    Admission_No: 'מספר מקרה',
    Age_Years: 'גיל',
    PrimaryUnit_Name: 'מחלקה',
    GeriatricConsultation: 'ייעוץ גריאטרי',
    GeriatricConsultationOpenDate: 'ייעוץ גריאטרי',
    Answer_Date: 'ייעוץ גריאטרי',
    AnswerDelayInHours: 'ייעוץ גריאטרי',
  };

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('pdfTable', { static: false }) pdfTable!: ElementRef;

  // Filters
  filterForm: FormGroup;
  departmentList: string[] = [];
  selectedDepartments: string[] = [];
  selectedYear: number | null = null;
  selectedQuarter: string | null = null;
  yearList: number[] = [];
  startDate: Date | null = null;
  endDate: Date | null = null;
  originalData: any[] = [];
  globalFilterValue: string = '';

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      globalFilter: ['']
    });
  }

  ngOnInit(): void {
    this.loadData();
   
  }

  loadData(): void {
    this.isLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}MitavGeriatric`).subscribe(
      (data) => {
        this.dataSource = new MatTableDataSource(data);
        this.originalData = data;
        this.totalResults = data.length;
        this.unitOptions = [...new Set(data.map((item) => item.PrimaryUnit_Name))].sort();
        this.updateGeriatricGauge()
        // Extract years for filtering
        const years = new Set<number>();
        data.forEach(item => {
          if (item.ATD_Admission_Date) {
            years.add(new Date(item.ATD_Admission_Date).getFullYear());
          }
        });
        this.yearList = Array.from(years).sort((a, b) => b - a);

        this.departmentList = Array.from(new Set(data.map((item) => item.PrimaryUnit_Name || 'Unknown')));

        setTimeout(() => {
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        });

        this.calculateGeriatricPercentage();
        this.isLoading = false;
      },
      (error) => {
        console.error('Error fetching data', error);
        this.isLoading = false;
      }
    );
  }

  applyFilters(): void {
    let filteredData = [...this.originalData];
  
    // ✅ Apply Date Filter
    if (this.startDate || this.endDate) {
      filteredData = filteredData.filter((item) => {
        const admissionDate = item.ATD_Admission_Date ? new Date(item.ATD_Admission_Date) : null;
        const start = this.startDate ? new Date(this.startDate.setHours(0, 0, 0, 0)) : null;
        const end = this.endDate ? new Date(this.endDate.setHours(23, 59, 59, 999)) : null;
  
        return (
          (!start || (admissionDate && admissionDate >= start)) &&
          (!end || (admissionDate && admissionDate <= end))
        );
      });
    }
  
    // ✅ Apply Department Filter
    if (this.selectedDepartments.length > 0) {
      filteredData = filteredData.filter((item) =>
        this.selectedDepartments.includes(item.PrimaryUnit_Name)
      );
    }
  
    // ✅ Apply Year Filter
    if (this.selectedYear) {
      filteredData = filteredData.filter((item) => {
        const admissionYear = item.ATD_Admission_Date ? new Date(item.ATD_Admission_Date).getFullYear() : null;
        return admissionYear === this.selectedYear;
      });
    }
  
    // ✅ Fix Quarter Filter to Ensure `selectedQuarter` is Not Null
    if (this.selectedQuarter) {
      const quarterMapping: { [key: string]: number[] } = {
        'רבעון 1': [1, 2, 3],
        'רבעון 2': [4, 5, 6],
        'רבעון 3': [7, 8, 9],
        'רבעון 4': [10, 11, 12]
      };
  
      if (this.selectedQuarter in quarterMapping) { // ✅ Ensure `selectedQuarter` exists in the mapping
        filteredData = filteredData.filter((item) => {
          const admissionMonth = item.ATD_Admission_Date ? new Date(item.ATD_Admission_Date).getMonth() + 1 : null;
          return admissionMonth && quarterMapping[this.selectedQuarter as keyof typeof quarterMapping].includes(admissionMonth);
        });
      }
    }
  
    // ✅ Update the filtered data
    this.dataSource.data = filteredData;
  
    // ✅ Update Gauge Data
    this.totalResults = this.dataSource.filteredData.length;

      // ✅ Update Gauge
  this.updateGeriatricGauge();
  }
  
  

  resetFilters(): void {
    this.filterForm.reset();
    this.selectedDepartments = [];
    this.selectedYear = null;
    this.selectedQuarter = null;
    this.startDate = null;
    this.endDate = null;
    this.applyFilters();
    this.updateGeriatricGauge();

  }

  calculateGeriatricPercentage(): void {
    const total = this.dataSource.filteredData.length;
    const withConsultation = this.dataSource.filteredData.filter(item => item.GeriatricConsultation === 'כן').length;
    this.filteredPercentage = total > 0 ? (withConsultation / total) * 100 : 0;
  }

  applyGlobalFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
    this.totalResults = this.dataSource.filteredData.length; // ✅ Update total results dynamically
  }
  updateGeriatricGauge(): void {
    this.totalGeriatricCases = this.dataSource.filteredData.length;
  
    // All patients with a consultation marked as 'כן'
    const geriatricYesCases = this.dataSource.filteredData.filter(item => item.GeriatricConsultation === 'כן');
  
    this.validGeriatricCount = geriatricYesCases.length;
    this.invalidGeriatricCount = this.totalGeriatricCases - this.validGeriatricCount;
  
    this.geriatricAssessmentGauge = this.totalGeriatricCases > 0
      ? (this.validGeriatricCount / this.totalGeriatricCases) * 100
      : 0;
  
    // ✅ Filter only those that have a numeric AnswerDelayInHours
    const delayCases = geriatricYesCases.filter(item =>
      item.AnswerDelayInHours !== 'אין ייעוץ' && !isNaN(Number(item.AnswerDelayInHours))
    );
  
    // ✅ Count buckets
    this.under24Count = delayCases.filter(item => Number(item.AnswerDelayInHours) < 24).length;
    this.from24to48Count = delayCases.filter(item =>
      Number(item.AnswerDelayInHours) >= 24 && Number(item.AnswerDelayInHours) <= 48
    ).length;
    this.over48Count = delayCases.filter(item => Number(item.AnswerDelayInHours) > 48).length;
  
    // ✅ Calculate percentages
    this.delayUnder24hPercentage = this.validGeriatricCount > 0
      ? (this.under24Count / this.validGeriatricCount) * 100
      : 0;
  
    this.delay24to48hPercentage = this.validGeriatricCount > 0
      ? (this.from24to48Count / this.validGeriatricCount) * 100
      : 0;
  
    this.delayOver48hPercentage = this.validGeriatricCount > 0
      ? (this.over48Count / this.validGeriatricCount) * 100
      : 0;
  }
  
  
  geriatricAssessmentGaugeColor(): string {
    if (this.geriatricAssessmentGauge >= 75) {
      return '#28a745'; // ✅ Green
    } else if (this.geriatricAssessmentGauge >= 50) {
      return '#ffc107'; // ✅ Orange
    } else {
      return '#dc3545'; // ✅ Red
    }
  }
  
}
