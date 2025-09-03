import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { environment } from '../../../environments/environment';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-skin-integrity-dashboard',
  templateUrl: './skin-integrity-dashboard.component.html',
  styleUrls: ['./skin-integrity-dashboard.component.scss']
})
export class SkinIntegrityDashboardComponent implements OnInit, AfterViewInit {

  // ✅ Tab selection
  selectedTab: number = 0;

  // ✅ Table Data Sources
  woundDataSource = new MatTableDataSource<any>();
  mattressDataSource = new MatTableDataSource<any>();

  // ✅ Column Headers for Type of Wounds Table (first letter lowercased)
  woundColumns = [
    'department','venous_Ulcer','arterial_Ulcer','skin_Tears','other',
    'pressure_Ulcer','tumor_Wound','rash','burn_Wound','trauma_Injury',
    'diabetic_Ulcer','iaD_Dermatitis', // 👈 was iAD_Dermatitis
    'kennedy_Terminal_Ulcer','total_Description_Count'
  ];

  // ✅ Column Headers for Mattresses Table (first letter lowercased)
  mattressColumns: string[] = [
    'department',
    'regular_Mattress',
    'egg_Crate_Mattress',
    'other_Device',
    'air_Mattress',
    'dynamic_Mattress',
    'seat_Cushion',
    'foam_Mattress',
    'visco_Mattress',
    'tempur_Mattress',
    'reactive_Mattress',
    'total_Support_Devices'
  ];
  

  // ✅ Column Header Map (Hebrew) — keys must match normalized (first-letter-lowercase) columns
  columnHeaderMap: { [key: string]: string } = {
    'department': 'מחלקה',
    'venous_Ulcer': 'כיב ורידי',
    'arterial_Ulcer': 'כיב עורקי',
    'skin_Tears': 'קרעים בעור',
    'other': 'אחר',
    'pressure_Ulcer': 'פצע לחץ',
    'tumor_Wound': 'פצע גידולי',
    'rash': 'פריחה',
    'burn_Wound': 'פצע כוויה',
    'trauma_Injury': 'טראומה/ חבלה',
    'diabetic_Ulcer': 'כיב סוכרתי',
    'iAD_Dermatitis': 'IAD - Incontinence Associated Dermatitis',
    'kennedy_Terminal_Ulcer': 'Kennedy Terminal Ulcer',
    'total_Description_Count': 'סך הכל סוגי פצעים',
    regular_Mattress: 'מזרון רגיל',
  egg_Crate_Mattress: 'מזרון ביצים',
  other_Device: 'אחר',
  air_Mattress: 'מזרון אוויר',
  dynamic_Mattress: 'מזרון דינמי',
  seat_Cushion: 'כרית הושבה',
  foam_Mattress: 'מזרון קצף',
  visco_Mattress: 'מזרון ויסקו',
  tempur_Mattress: 'מזרון טמפור',
  reactive_Mattress: 'מזרון מפזר לחץ',
  total_Support_Devices: 'סך הכל אביזרי תמיכה'
  };

  // ✅ Filters
  departmentList: string[] = [];
  selectedDepartments: string[] = [];
  startDate: Date | null = null;
  endDate: Date | null = null;
  selectedYear: number | null = null;
  selectedQuarter: string | null = null;
  yearList: number[] = [];

  @ViewChild('woundPaginator') woundPaginator!: MatPaginator;
  @ViewChild('mattressPaginator') mattressPaginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.initializeYearList();
    this.fetchWoundSummary();
    this.fetchMattressSummary(); // 👈 add this

  }

  ngAfterViewInit(): void {
    this.woundDataSource.paginator = this.woundPaginator;
    this.mattressDataSource.paginator = this.mattressPaginator;
    this.woundDataSource.sort = this.sort;
    this.mattressDataSource.sort = this.sort;
  }

  // 🔧 Normalize only the first letter of each top-level key
  private normalizeKeysFirstLower<T extends Record<string, any>>(obj: T): any {
    const out: any = {};
    Object.keys(obj || {}).forEach(k => {
      if (!k.length) return;
      const nk = k[0].toLowerCase() + k.slice(1);
      out[nk] = (obj as any)[k];
    });
    return out;
  }

  // ✅ Initialize Year Selection
  initializeYearList(): void {
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
      this.yearList.push(currentYear - i);
    }
  }

  // ✅ Fetch Wound Summary Data
  fetchWoundSummary(): void {
    const params = this.buildQueryParams();

    this.http.get<any[]>(`${environment.apiUrl}/SkinIntegrityReportAPI/TypeOfWoundSummary`, { params })
      .subscribe(
        (data) => {
          const normalized = (data || []).map(r => this.normalizeKeysFirstLower(r));
          this.woundDataSource.data = normalized;
          this.extractUniqueDepartments(normalized); // populate department dropdown
        },
        (error) => console.error('Error fetching wound data:', error)
      );
  }

  // ✅ Fetch Mattress Summary Data
  fetchMattressSummary(): void {
    const params = this.buildQueryParams();

    this.http.get<any[]>(`${environment.apiUrl}/SkinIntegrityReportAPI/MattressesSummary`, { params })
      .subscribe(
        (data) => {
          const normalized = (data || []).map(r => this.normalizeKeysFirstLower(r));
          this.mattressDataSource.data = normalized;
        },
        (error) => console.error('Error fetching mattress data:', error)
      );
  }

  // ✅ Extract Unique Departments for Filters
  extractUniqueDepartments(data: any[]): void {
    this.departmentList = Array.from(new Set((data || []).map(item => item.department).filter(Boolean)));
  }

  // ✅ Apply Filters
  applyFilters(): void {
    this.fetchWoundSummary();
    this.fetchMattressSummary();
  }

  // ✅ Reset Filters
  resetFilters(): void {
    this.selectedDepartments = [];
    this.startDate = null;
    this.endDate = null;

    this.woundDataSource.filter = '';
    this.mattressDataSource.filter = '';

    this.fetchWoundSummary();
    this.fetchMattressSummary();
  }

  // ✅ Search Across All Columns
  applyGlobalFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.woundDataSource.filter = filterValue;
    this.mattressDataSource.filter = filterValue;
  }

  // ✅ Build Query Params for API Requests
  private buildQueryParams(): HttpParams {
    let params = new HttpParams();

    if (this.startDate && !isNaN(this.startDate.getTime())) {
      const formattedStart = this.startDate.toISOString().split('T')[0];
      params = params.set('startDate', formattedStart);
    }

    if (this.endDate && !isNaN(this.endDate.getTime())) {
      const formattedEnd = this.endDate.toISOString().split('T')[0];
      params = params.set('endDate', formattedEnd);
    }

    if (this.selectedDepartments && this.selectedDepartments.length > 0) {
      params = params.set('departments', this.selectedDepartments.join(','));
    }

    console.log('📦 Final HttpParams:', params.keys().map(k => `${k}=${params.get(k)}`));
    return params;
  }

  // ✅ Export (uses the normalized keys and Hebrew headers)
  exportToExcel(): void {
    const isWoundTab = this.selectedTab === 0;
    const dataSource = isWoundTab ? this.woundDataSource.filteredData : this.mattressDataSource.filteredData;
    const columns = isWoundTab ? this.woundColumns : this.mattressColumns;

    const dataForExport = (dataSource || []).map(row => {
      const exportRow: any = {};
      columns.forEach(col => {
        const header = this.columnHeaderMap[col] || col;
        exportRow[header] = row[col];
      });
      return exportRow;
    });

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataForExport);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'סיכום': worksheet },
      SheetNames: ['סיכום']
    };

    const fileName = isWoundTab ? 'Wound_Summary.xlsx' : 'Mattress_Summary.xlsx';
    XLSX.writeFile(workbook, fileName);
  }

  // (Optional) Combined endpoint — normalize if/when you render it
  fetchSummaryByDepartment(): void {
    const params = this.buildQueryParams();

    this.http.get<any[]>(`${environment.apiUrl}/SkinIntegrityReportAPI/SummaryByDepartment`, { params })
      .subscribe(
        (data) => {
          const normalized = (data || []).map(r => this.normalizeKeysFirstLower(r));
          console.log('Fetched Combined Wound + Mattress Summary (normalized):', normalized);
          // Handle this data however you want (e.g., display it in a third table)
        },
        (error) => console.error('Error fetching summary by department:', error)
      );
  }
}
