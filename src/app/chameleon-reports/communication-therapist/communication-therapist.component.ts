import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { Chart, ChartData, ChartType, registerables } from 'chart.js';
import { environment } from '../../../environments/environment';
import * as XLSX from 'xlsx';


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
  dailyFollowUpDataSource = new MatTableDataSource<any>([]);
  anamnesisResultsDataSource = new MatTableDataSource<any>([]);
  fullListDataSource = new MatTableDataSource<any>([]);

  dailyFollowUpColumns: string[] = ['employeeName', 'simpleA', 'complexB', 'veryComplexC', 'groupD'];
  anamnesisResultsColumns: string[] = ['employeeName', 'simple', 'complex', 'veryComplex'];
  fullListColumns: string[] = [
    'admissionNo',
    'idNum',
    'firstName',
    'lastName',
    'employeeName',
    'entry_Date',
    'answerType',
    'freeText'
  ];

  columnDisplayNames2: { [key: string]: string } = {
    'employeeName': 'שם עובד',
    'simple': 'טיפול פשוט',
    'complex': 'טיפול מורכב',
    'veryComplex': 'טיפול מאוד מורכב'
  };
  
// Define Hebrew display names for the columns
columnDisplayNames: { [key: string]: string } = {
  admissionNo: 'מספר מקרה',
  idNum: 'מספר זהות',
  firstName: 'שם פרטי',
  lastName: 'שם משפחה',
  employeeName: 'שם העובד',
  entry_Date: 'תאריך כניסה',
  answerType: 'סוג תשובה',
  freeText: 'טקסט חופשי'
};
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

  @ViewChild('dailyFollowUpPaginator') dailyFollowUpPaginator!: MatPaginator;
 // @ViewChild('dailyFollowUpSort') dailyFollowUpSort!: MatSort;
  
  @ViewChild('anamnesisResultsPaginator') anamnesisResultsPaginator!: MatPaginator;
  @ViewChild('anamnesisResultsSort') anamnesisResultsSort!: MatSort;
  
  @ViewChild('fullListPaginator') fullListPaginator!: MatPaginator;
  @ViewChild('fullListSort') fullListSort!: MatSort;

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
  ngAfterViewInit(): void {
    this.dailyFollowUpDataSource.paginator = this.dailyFollowUpPaginator;
    //this.dailyFollowUpDataSource.sort = this.dailyFollowUpSort;
  
    this.anamnesisResultsDataSource.paginator = this.anamnesisResultsPaginator;
    this.anamnesisResultsDataSource.sort = this.anamnesisResultsSort;
  
    this.fullListDataSource.paginator = this.fullListPaginator;
    this.fullListDataSource.sort = this.fullListSort;
  
    console.log('Daily Follow-Up Paginator:', this.dailyFollowUpPaginator);
    //console.log('Daily Follow-Up Sort:', this.dailyFollowUpSort);
  }
  
  
  

  
  applyFilters(): void {
    const filters = this.filterForm.value;
    const year = filters.year;
    const month = filters.month;
    const admissionNo = filters.admissionNo;
    const idNum = filters.idNum;


    // Fetch data for all tables
    this.fetchDailyFollowUpData(year, month);
    this.fetchAnamnesisResultsData(year, month);
    this.fetchFullListDailyFollowUp(year, month);
    this.fetchFilteredAnamnesisResults(year, month, admissionNo, idNum);

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
  
          // Assign paginator and sort after data is loaded
          if (this.dailyFollowUpPaginator) {
            this.dailyFollowUpDataSource.paginator = this.dailyFollowUpPaginator;
          }
         
  
          console.log('Daily Follow-Up Data:', this.dailyFollowUpDataSource.data);
          console.log('Paginator:', this.dailyFollowUpPaginator);
  
          this.loading = false;
        },
        (error) => {
          console.error('Error fetching Daily Follow-Up data:', error);
          this.loading = false;
        }
      );
  }
  fetchFilteredAnamnesisResults(year?: number, month?: number, admissionNo?: string, idNum?: string): void {
    this.loading = true;

    const params: any = {};
    if (year) params.year = year;
    if (month) params.month = month;
    if (admissionNo) params.admissionNo = admissionNo;
    if (idNum) params.idNum = idNum;

    this.http
    .get<any[]>(`${environment.apiUrl}CommunicationTherapist/FilteredAnamnesisResults`, { params })
    .subscribe(
      (data) => {
        console.log('API Response:', data); // Verify the full data is returned
        this.fullListDataSource.data = data;
      },
      (error) => {
        console.error('Error fetching data:', error);
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
  
          // Assign paginator and sort after data is loaded
          if (this.anamnesisResultsPaginator) {
            this.anamnesisResultsDataSource.paginator = this.anamnesisResultsPaginator;
          }
          if (this.anamnesisResultsSort) {
            this.anamnesisResultsDataSource.sort = this.anamnesisResultsSort;
          }
  
          console.log('Anamnesis Results Data:', this.anamnesisResultsDataSource.data);
          console.log('Paginator:', this.anamnesisResultsPaginator);
          console.log('Sort:', this.anamnesisResultsSort);
  
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
  
          // Assign paginator and sort after data is loaded
          if (this.fullListPaginator) {
            this.fullListDataSource.paginator = this.fullListPaginator;
          }
          if (this.fullListSort) {
            this.fullListDataSource.sort = this.fullListSort;
          }
  
          console.log('Full List Daily Follow-Up Data:', this.fullListDataSource.data);
          console.log('Paginator:', this.fullListPaginator);
          console.log('Sort:', this.fullListSort);
  
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

  exportDailyFollowUpToExcel(): void {
    this.exportToExcel(this.dailyFollowUpDataSource, 'Daily_Follow_Up_Data.xlsx');
  }
  
  exportAnamnesisResultsToExcel(): void {
    this.exportToExcel(this.anamnesisResultsDataSource, 'Anamnesis_Results_Data.xlsx');
  }
  
  exportFullListToExcel(): void {
    this.exportToExcel(this.fullListDataSource, 'Full_List_Daily_Follow_Up_Data.xlsx');
  }
  private exportToExcel(dataSource: MatTableDataSource<any>, fileName: string): void {
    // ✅ Convert MatTableDataSource to an array
    const data = dataSource.data;
  
    // ✅ Hebrew column names mapping
    const hebrewColumnNames: { [key: string]: string } = {
      AdmissionNo: 'מספר מקרה',
      IdNum: 'מספר זהות',
      FirstName: 'שם פרטי',
      LastName: 'שם משפחה',
      EmployeeName: 'שם העובד',
      Entry_Date: 'תאריך כניסה',
      AnswerType: 'סוג תשובה',
      FreeText: 'טקסט חופשי'
    };
  
    // ✅ Transform data to use Hebrew column headers
    const transformedData = data.map(row => {
      let newRow: any = {};
      Object.keys(row).forEach(key => {
        const hebrewKey = hebrewColumnNames[key] || key; // Use Hebrew name if available
        newRow[hebrewKey] = row[key];
      });
      return newRow;
    });
  
    // ✅ Create worksheet without `origin`
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(transformedData);
  
    // ✅ Set right-to-left formatting (RTL)
    worksheet['!cols'] = [{ width: 20 }]; // Adjust column width
    worksheet['!dir'] = 'rtl'; // Set direction to right-to-left
  
    // ✅ Create workbook
    const workbook: XLSX.WorkBook = {
      Sheets: { 'נתונים': worksheet },
      SheetNames: ['נתונים']
    };
  
    // ✅ Save the file
    XLSX.writeFile(workbook, fileName);
  }
  
  
}
