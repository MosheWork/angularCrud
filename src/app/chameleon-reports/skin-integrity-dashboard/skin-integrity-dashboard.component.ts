import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-skin-integrity-dashboard',
  templateUrl: './skin-integrity-dashboard.component.html',
  styleUrls: ['./skin-integrity-dashboard.component.scss']
})
export class SkinIntegrityDashboardComponent implements OnInit, AfterViewInit {

  // ✅ Define displayedColumns as string array
  displayedColumns: string[] = [];
  
  dataSource = new MatTableDataSource<any>();
  isLoading: boolean = true;
  showGraph: boolean = false;
  departmentList: string[] = [];
  selectedDepartments: string[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.initializeColumns();
    this.fetchSkinIntegritySummary();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator; // ✅ Bind paginator to dataSource
    this.dataSource.sort = this.sort; // ✅ Bind sorting to dataSource
  }

  fetchSkinIntegritySummary(): void {
    this.http.get<any[]>(`${environment.apiUrl}/SkinIntegrityReportAPI/SummaryByDepartment`).subscribe(
      (data) => {
        console.log('Skin Integrity Summary Data:', data);
        this.dataSource.data = data;

        this.extractUniqueDepartments(data);
        this.isLoading = false;

        // ✅ Ensure paginator and sorting are set after data is loaded
        setTimeout(() => {
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        });
      },
      (error) => {
        console.error('❌ Error fetching summary:', error);
        this.isLoading = false;
      }
    );
  }

  // ✅ Create a function to initialize columns
  initializeColumns(): void {
    this.displayedColumns = Object.keys(this.columnHeaderMap);
  }

  columns: string[] = [
    'Department',
    'Venous_Ulcer',
    'Arterial_Ulcer',
    'Skin_Tears',
    'Other',
    'Pressure_Ulcer',
    'Tumor_Wound',
    'Rash',
    'Burn_Wound',
    'Trauma_Injury',
    'Diabetic_Ulcer',
    'IAD_Dermatitis',
    'Kennedy_Terminal_Ulcer',
    'Total_Description_Count',
    'Regular_Mattress',
    'Egg_Crate_Mattress',
    'Other_Device',
    'Air_Mattress',
    'Dynamic_Mattress',
    'Seat_Cushion',
    'Foam_Mattress',
    'Visco_Mattress',
    'Tempur_Mattress',
    'Reactive_Mattress',
    'Total_Support_Devices'
  ];

  // ✅ Use the correct Hebrew column names
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

  extractUniqueDepartments(data: any[]): void {
    this.departmentList = Array.from(new Set(data.map(item => item.Department)));
  }

  applyFilters(): void {
    let filteredData = [...this.dataSource.data];

    if (this.selectedDepartments.length > 0) {
      filteredData = filteredData.filter(item => this.selectedDepartments.includes(item.Department));
    }

    this.dataSource.data = filteredData;
  }

  resetFilters(): void {
    this.selectedDepartments = [];
    this.dataSource.data = [...this.dataSource.data];
  }

  applyGlobalFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
  }
}
