import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { environment } from '../../../environments/environment';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-mitav-geriatric',
  templateUrl: './mitav-geriatric.component.html',
  styleUrls: ['./mitav-geriatric.component.scss'],
})
export class MitavGeriatricComponent implements OnInit {
  title: string = 'דאשבורד גריאטריה ';
  totalResults: number = 0;
  isLoading: boolean = true;

  // table datasource (after mapping to camel keys)
  dataSource: MatTableDataSource<any> = new MatTableDataSource();
  originalData: any[] = [];

  // dropdowns
  unitOptions: string[] = [];

  // gauges + stats
  filteredPercentage: number = 0;
  validGeriatricCount: number = 0;
  invalidGeriatricCount: number = 0;
  totalGeriatricCases: number = 0;
  geriatricAssessmentGauge: number = 0;

  delayUnder24hPercentage: number = 0;
  delay24to48hPercentage: number = 0;
  delayOver48hPercentage: number = 0;
  under24Count: number = 0;
  from24to48Count: number = 0;
  over48Count: number = 0;

  // displayed columns (camel)
  displayedColumns: string[] = [
    'atdAdmissionDate',
    'admissionNo',
    'ageYears',
    'primaryUnitName',
    'geriatricConsultation',
    'geriatricConsultationOpenDate',
    'answerDate',
    'answerDelayInHours'
  ];

  // labels map
  columnLabels: { [key: string]: string } = {
    atdAdmissionDate: 'תאריך קבלה',
    admissionNo: 'מספר מקרה',
    ageYears: 'גיל',
    primaryUnitName: 'מחלקה',
    geriatricConsultation: 'ייעוץ גריאטרי',
    geriatricConsultationOpenDate: 'תאריך פתיחת הייעוץ',
    answerDate: 'תאריך תשובה על הייעוץ',
    answerDelayInHours: 'הפרש בשעות בין פתיחת לתשובה',
  };
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('pdfTable', { static: false }) pdfTable!: ElementRef;

  // Filters (template-driven + helper state)
  filterForm: FormGroup;
  departmentList: string[] = [];
  selectedDepartments: string[] = [];
  selectedYear: number | null = null;
  selectedQuarter: string | null = null;
  yearList: number[] = [];
  startDate: Date | null = null;
  endDate: Date | null = null;
  globalFilterValue: string = '';

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      globalFilter: ['']
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  // ------- Load + normalize keys from backend to camel -------
  loadData(): void {
    this.isLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}MitavGeriatric`).subscribe(
      (data) => {
        // 🔄 normalize all incoming records to clean camelCase keys
        const normalized = (data || []).map(r => ({
          atdAdmissionDate: r.atD_Admission_Date ?? r.ATD_Admission_Date ?? null,
          admissionNo: r.admission_No ?? r.Admission_No ?? null,
          ageYears: r.age_Years ?? r.Age_Years ?? null,
          primaryUnitName: r.primaryUnit_Name ?? r.PrimaryUnit_Name ?? null,
          geriatricConsultation: r.geriatricConsultation ?? r.GeriatricConsultation ?? null,
          geriatricConsultationOpenDate: r.geriatricConsultationOpenDate ?? r.GeriatricConsultationOpenDate ?? null,
          answerDate: r.answer_Date ?? r.Answer_Date ?? null,
          answerDelayInHours: r.answerDelayInHours ?? r.AnswerDelayInHours ?? null,
        }));
  
        this.dataSource = new MatTableDataSource(normalized);
        this.originalData = normalized;
        this.totalResults = normalized.length;
  
        // ⬇ options & years based on normalized keys
        this.departmentList = Array.from(new Set(
          normalized
            .map(i => (i.primaryUnitName ?? '').trim())
            .filter(v => v.length > 0)
        )).sort((a, b) => a.localeCompare(b, 'he'));  
        const years = new Set<number>();
        normalized.forEach(i => {
          if (i.atdAdmissionDate) years.add(new Date(i.atdAdmissionDate).getFullYear());
        });
        this.yearList = Array.from(years).sort((a, b) => b - a);
  
        setTimeout(() => {
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        });
  
        this.calculateGeriatricPercentage();
        this.updateGeriatricGauge();
        this.isLoading = false;
      },
      (error) => {
        console.error('Error fetching data', error);
        this.isLoading = false;
      }
    );
  }
  

  // ------- Filters -------
  applyGlobalFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.globalFilterValue = filterValue;
    this.dataSource.filterPredicate = (row, _) => {
      if (!this.globalFilterValue) return true;
      return Object.values(row).some(v => (v ?? '').toString().toLowerCase().includes(this.globalFilterValue));
    };
    this.dataSource.filter = Math.random().toString(); // trigger
    this.totalResults = this.dataSource.filteredData.length;
    this.updateGeriatricGauge();
  }

  applyFilters(): void {
    let filteredData = [...this.originalData];

    // date range
    if (this.startDate || this.endDate) {
      filteredData = filteredData.filter((item) => {
        const admissionDate = item.atdAdmissionDate ? new Date(item.atdAdmissionDate) : null;
        const start = this.startDate ? new Date(this.startDate) : null;
        const end = this.endDate ? new Date(this.endDate) : null;
        if (start) start.setHours(0, 0, 0, 0);
        if (end) end.setHours(23, 59, 59, 999);

        return (
          (!start || (admissionDate && admissionDate >= start)) &&
          (!end || (admissionDate && admissionDate <= end))
        );
      });
    }

    // departments
    if (this.selectedDepartments.length > 0) {
      filteredData = filteredData.filter((item) =>
        this.selectedDepartments.includes(item.primaryUnitName)
      );
    }

    // year
    if (this.selectedYear) {
      filteredData = filteredData.filter((item) => {
        const admissionYear = item.atdAdmissionDate ? new Date(item.atdAdmissionDate).getFullYear() : null;
        return admissionYear === this.selectedYear;
      });
    }

// Quarter filter (typed mapping + explicit narrowing)
if (this.selectedQuarter) {
  const quarterMapping: Record<'רבעון 1' | 'רבעון 2' | 'רבעון 3' | 'רבעון 4', number[]> = {
    'רבעון 1': [1, 2, 3],
    'רבעון 2': [4, 5, 6],
    'רבעון 3': [7, 8, 9],
    'רבעון 4': [10, 11, 12],
  };

  const q = this.selectedQuarter as 'רבעון 1' | 'רבעון 2' | 'רבעון 3' | 'רבעון 4';
  const months = quarterMapping[q];

  filteredData = filteredData.filter((item) => {
    const month = item.atdAdmissionDate
      ? new Date(item.atdAdmissionDate).getMonth() + 1
      : null;
    if (month === null) return false;     // 🔒 ensure it's a number
    return months.includes(month);        // ✅ months: number[], month: number
  });
}


    // apply to table
    this.dataSource.data = filteredData;

    // re-apply global text filter if exists
    if (this.globalFilterValue) {
      this.applyGlobalFilter({ target: { value: this.globalFilterValue } } as any as Event);
    } else {
      this.totalResults = this.dataSource.filteredData.length;
      this.updateGeriatricGauge();
    }
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.selectedDepartments = [];
    this.selectedYear = null;
    this.selectedQuarter = null;
    this.startDate = null;
    this.endDate = null;
    this.globalFilterValue = '';

    this.dataSource.data = [...this.originalData];
    this.totalResults = this.dataSource.filteredData.length;
    this.updateGeriatricGauge();
  }

  // ------- Stats & Gauges -------
  calculateGeriatricPercentage(): void {
    const total = this.dataSource.filteredData.length;
    const withConsultation = this.dataSource.filteredData
      .filter(item => item.geriatricConsultation === 'כן').length;
    this.filteredPercentage = total > 0 ? (withConsultation / total) * 100 : 0;
  }

  updateGeriatricGauge(): void {
    this.totalGeriatricCases = this.dataSource.filteredData.length;

    // only rows with yes
    const yesCases = this.dataSource.filteredData
      .filter(item => item.geriatricConsultation === 'כן');

    this.validGeriatricCount = yesCases.length;
    this.invalidGeriatricCount = this.totalGeriatricCases - this.validGeriatricCount;

    this.geriatricAssessmentGauge = this.totalGeriatricCases > 0
      ? Math.round((this.validGeriatricCount / this.totalGeriatricCases) * 100)
      : 0;

    // delay buckets (numbers only)
    const delayCases = yesCases.filter(item =>
      item.answerDelayInHours !== 'אין ייעוץ' && !isNaN(Number(item.answerDelayInHours))
    );

    this.under24Count = delayCases.filter(i => Number(i.answerDelayInHours) < 24).length;
    this.from24to48Count = delayCases.filter(i => {
      const v = Number(i.answerDelayInHours);
      return v >= 24 && v <= 48;
    }).length;
    this.over48Count = delayCases.filter(i => Number(i.answerDelayInHours) > 48).length;

    this.delayUnder24hPercentage = this.validGeriatricCount > 0
      ? Math.round((this.under24Count / this.validGeriatricCount) * 100)
      : 0;
    this.delay24to48hPercentage = this.validGeriatricCount > 0
      ? Math.round((this.from24to48Count / this.validGeriatricCount) * 100)
      : 0;
    this.delayOver48hPercentage = this.validGeriatricCount > 0
      ? Math.round((this.over48Count / this.validGeriatricCount) * 100)
      : 0;
  }

  geriatricAssessmentGaugeColor(): string {
    if (this.geriatricAssessmentGauge >= 75) return '#28a745'; // green
    if (this.geriatricAssessmentGauge >= 50) return '#ffc107'; // orange
    return '#dc3545'; // red
  }

  // ------- Export -------
  exportToExcel(): void {
    const dataToExport = this.dataSource.filteredData;
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook: XLSX.WorkBook = { Sheets: { 'דו"ח גריאטריה': worksheet }, SheetNames: ['דו"ח גריאטריה'] };
    XLSX.writeFile(workbook, 'דו"ח_גריאטריה.xlsx');
  }
}
