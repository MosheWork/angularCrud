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

  // ✅ Column Headers for Type of Wounds Table
  woundColumns: string[] = [
    'Department', 'Venous_Ulcer', 'Arterial_Ulcer', 'Skin_Tears', 'Other',
    'Pressure_Ulcer', 'Tumor_Wound', 'Rash', 'Burn_Wound', 'Trauma_Injury',
    'Diabetic_Ulcer', 'IAD_Dermatitis', 'Kennedy_Terminal_Ulcer', 'Total_Description_Count'
  ];

  // ✅ Column Headers for Mattresses Table
  mattressColumns: string[] = [
    'Department', 'Regular_Mattress', 'Egg_Crate_Mattress', 'Other_Device', 'Air_Mattress',
    'Dynamic_Mattress', 'Seat_Cushion', 'Foam_Mattress', 'Visco_Mattress', 'Tempur_Mattress',
    'Reactive_Mattress', 'Total_Support_Devices'
  ];

  // ✅ Column Header Map (Hebrew Names)
  columnHeaderMap: { [key: string]: string } = {
    'Department': 'מחלקה',
    'Venous_Ulcer': 'כיב ורידי',
    'Arterial_Ulcer': 'כיב עורקי',
    'Skin_Tears': 'קרעים בעור',
    'Other': 'אחר',
    'Pressure_Ulcer': 'פצע לחץ',
    'Tumor_Wound': 'פצע גידולי',
    'Rash': 'פריחה',
    'Burn_Wound': 'פצע כוויה',
    'Trauma_Injury': 'טראומה/ חבלה',
    'Diabetic_Ulcer': 'כיב סוכרתי',
    'IAD_Dermatitis': 'IAD - Incontinence Associated Dermatitis',
    'Kennedy_Terminal_Ulcer': 'Kennedy Terminal Ulcer',
    'Total_Description_Count': 'סך הכל סוגי פצעים',
    'Regular_Mattress': 'מזרון רגיל',
    'Egg_Crate_Mattress': 'מזרון ביצים',
    'Other_Device': 'אחר',
    'Air_Mattress': 'מזרון אוויר',
    'Dynamic_Mattress': 'מזרון דינמי',
    'Seat_Cushion': 'כרית הושבה',
    'Foam_Mattress': 'מזרון קצף',
    'Visco_Mattress': 'מזרון ויסקו',
    'Tempur_Mattress': 'מזרון טמפור',
    'Reactive_Mattress': 'מזרון מפזר לחץ',
    'Total_Support_Devices': 'סך הכל אביזרי תמיכה'
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
 
  }

  ngAfterViewInit(): void {
    this.woundDataSource.paginator = this.woundPaginator;
    this.mattressDataSource.paginator = this.mattressPaginator;
    this.woundDataSource.sort = this.sort;
    this.mattressDataSource.sort = this.sort;
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
  
    this.http.get<any[]>(`${environment.apiUrl}/SkinIntegrityReportAPI/TypeOfWoundSummary`, { params }).subscribe(
      (data) => {
        this.woundDataSource.data = data;
        this.extractUniqueDepartments(data); // populate department dropdown
      },
      (error) => console.error('Error fetching wound data:', error)
    );
  }
  
  fetchMattressSummary(): void {
    const params = this.buildQueryParams();
  
    this.http.get<any[]>(`${environment.apiUrl}/SkinIntegrityReportAPI/MattressesSummary`, { params }).subscribe(
      (data) => {
        this.mattressDataSource.data = data;
      },
      (error) => console.error('Error fetching mattress data:', error)
    );
  }
  
  // ✅ Fetch Mattress Summary Data
   and(): void {
    let params = this.buildQueryParams();
    this.http.get<any[]>(`${environment.apiUrl}/SkinIntegrityReportAPI/MattressesSummary`, { params }).subscribe(
      (data) => {
        console.log('Fetched Mattress Data:', data);
        this.mattressDataSource.data = data;
      },
      (error) => console.error('Error fetching mattress data:', error)
    );
  }

  // ✅ Extract Unique Departments for Filters
  extractUniqueDepartments(data: any[]): void {
    this.departmentList = Array.from(new Set(data.map(item => item.Department)));
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
  
    // Optionally reset the search input too
    this.woundDataSource.filter = '';
    this.mattressDataSource.filter = '';
  
    // Now re-fetch with empty filters
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
  
    if (this.startDate && this.startDate instanceof Date && !isNaN(this.startDate.getTime())) {
      const formattedStart = this.startDate.toISOString().split('T')[0];
      params = params.set('startDate', formattedStart);
    }
  
    if (this.endDate && this.endDate instanceof Date && !isNaN(this.endDate.getTime())) {
      const formattedEnd = this.endDate.toISOString().split('T')[0];
      params = params.set('endDate', formattedEnd);
    }
  
    if (this.selectedDepartments && this.selectedDepartments.length > 0) {
      params = params.set('departments', this.selectedDepartments.join(','));
    }
  
    console.log('📦 Final HttpParams:', params.keys().map(k => `${k}=${params.get(k)}`));
    return params;
  }
  
  
  
  exportToExcel(): void {
    const isWoundTab = this.selectedTab === 0;
    const dataSource = isWoundTab ? this.woundDataSource.filteredData : this.mattressDataSource.filteredData;
    const columns = isWoundTab ? this.woundColumns : this.mattressColumns;
  
    const dataForExport = dataSource.map(row => {
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
  fetchSummaryByDepartment(): void {
    let params = this.buildQueryParams();
  
    this.http.get<any[]>(`${environment.apiUrl}/SkinIntegrityReportAPI/SummaryByDepartment`, { params }).subscribe(
      (data) => {
        console.log('Fetched Combined Wound + Mattress Summary:', data);
        // Handle this data however you want (e.g., display it in a third table)
      },
      (error) => console.error('Error fetching summary by department:', error)
    );
  }
    
}
