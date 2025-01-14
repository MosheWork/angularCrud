import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { FormGroup, FormControl } from '@angular/forms';
import * as XLSX from 'xlsx';
import { environment } from '../../../environments/environment';
import { Renderer2 } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';

@Component({
  selector: 'app-diabetes-consultation',
  templateUrl: './diabetes-consultation.component.html',
  styleUrls: ['./diabetes-consultation.component.scss'],
})
export class DiabetesConsultationComponent implements OnInit, AfterViewInit {
  // Properties for the data
  filteredData: any[] = [];
  isDarkMode = false;
  EnsoleenresultsLength = 0;
  totalHos: number = 0;
  totalHosWithIcd9: number = 0;
  Icd9Percentage: number = 0;
  TotalHosLabResultover180: number = 0;
  labResultOver180Percentage: number = 0;
  TotalHosInsulin: number = 0;
  insulinPercentage: number = 0;
  HemoglobinAbove8Count: number = 0;
  HemoglobinAbove8Percentage: number = 0;
  Title1: string = ' סה\"כ מטופלים- ';
  Title2: string = 'מאושפים:';
  titleUnit: string = 'דאשבורד סכרת';
  totalResults: number = 0;

  medicalRecordsCount: number = 0; 
  startDate: Date | null = null;
  endDate: Date | null = null;

  // Global filter value
  globalSourceTableFilter: string = 'All'; // Default to show all records
 // Global date range filter
 globalDateFilter: { start: Date | null; end: Date | null } = { start: null, end: null };

  // Store original data for each table
  originalDataSource1: any[] = [];
  originalDataSource3: any[] = [];
  originalDataSource4: any[] = [];
  originalDataSourceHemoglobin: any[] = [];
  originalDataSourceAllConsiliums: any[] = [];
  originalDataSourceBelow70: any[] = [];




  displayedColumns: string[] = [
    'Admission_No',
    'Admission_Date',
    'First_Name',
    'Last_Name',
    'Count_Above_180_Less_48h',
    'Source_Table'
  ];
  displayedColumns3: string[] = [
    'Admission_No',
    'Admission_Date',
    'Id_Num',
    'First_Name',
    'Last_Name',
    'Name',
    'Entry_Date',
  ];
  displayedColumns4: string[] = [
    'Source_Table',
    'Admission_No',
    'Admission_Date',
    'Id_Num',
    'First_Name',
    'Last_Name',
    'ICD9',
    'Name',
    'Entry_Date',
  ];

  displayedColumnsHemoglobin: string[] = [
    'Admission_Date',
    'TestCode',
    'TestName',
    'Result',
    'TestDate',
    'Id_Num',
    'First_Name',
    'Last_Name',
  ];
  displayedColumnsAllConsiliums: string[] = [
    'Id_Num',
    'First_Name',
    'Last_Name',
    'UnitName',
    'Question',
    'Diagnosis_Text',
    'Consulted_Unit',
    'Entry_Date',
    'Answer_Text',
    'Answer_Date',
  ];
  displayedColumnsBelow70: string[] = [
    'Admission_No',
    'Admission_Date',
    'First_Name',
    'Last_Name',
    'Count_Less_70_Less_48h',
    'Source_Table',
  ];

  dataSource1 = new MatTableDataSource<any>();
  dataSource3 = new MatTableDataSource<any>();
  dataSource4 = new MatTableDataSource<any>();
  dataSourceHemoglobin = new MatTableDataSource<any>();
  dataSourceAllConsiliums = new MatTableDataSource<any>();
  dataSourceBelow70 = new MatTableDataSource<any>();


  filterForm: FormGroup = new FormGroup({
    globalFilter: new FormControl(''),
  });

  @ViewChild('paginator1') paginator1!: MatPaginator;
  @ViewChild('Ensoleen') Ensoleen!: MatPaginator;
  @ViewChild('paginator4') paginator4!: MatPaginator;
  @ViewChild('paginatorHemoglobin') paginatorHemoglobin!: MatPaginator;
  @ViewChild('paginatorAllConsiliums') paginatorAllConsiliums!: MatPaginator;
  @ViewChild('paginatorBelow70') paginatorBelow70!: MatPaginator;

  @ViewChild('sort1') sort1!: MatSort;
  @ViewChild('sort3', { static: false }) sort3!: MatSort;
  @ViewChild('sort4') sort4!: MatSort;
  @ViewChild('sortHemoglobin') sortHemoglobin!: MatSort;
  @ViewChild('sortAllConsiliums') sortAllConsiliums!: MatSort;
  @ViewChild('sortBelow70') sortBelow70!: MatSort;

  constructor(private http: HttpClient, private renderer: Renderer2) {}

  ngOnInit(): void {
    //this.fetchGeneralData();
    this.fetchLabResultsAboveThreshold();
    this.fetchInsulinData();
    this.fetchDiagnosisData();
    this.fetchHemoglobinAbove8();
    this.fetchAllConsiliums();
    this.fetchLabResultsBelow70(); 
    this.fetchMedicalRecordsCount(); 


    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    this.isDarkMode = savedDarkMode;

    if (this.isDarkMode) {
      document.body.classList.add('dark-mode');
    }

    this.filterForm
      .get('globalFilter')
      ?.valueChanges.subscribe((filterValue) => {
        this.applyFilter(filterValue);
      });
  }

  ngAfterViewInit(): void {
    this.dataSource1.paginator = this.paginator1;
    this.dataSource1.sort = this.sort1;

    this.dataSource3.paginator = this.Ensoleen;
    this.dataSource3.sort = this.sort3;

    this.dataSource4.paginator = this.paginator4;
    this.dataSource4.sort = this.sort4;

    this.dataSourceHemoglobin.paginator = this.paginatorHemoglobin;
    this.dataSourceHemoglobin.sort = this.sortHemoglobin;

    this.dataSourceAllConsiliums.paginator = this.paginatorAllConsiliums;
    this.dataSourceAllConsiliums.sort = this.sortAllConsiliums;
    this.dataSourceBelow70.paginator = this.paginatorBelow70;
    this.dataSourceBelow70.sort = this.sortBelow70;
  }

  // fetchGeneralData(): void {
  //   this.http.get<any>(`${environment.apiUrl}/DiabetesConsultation`).subscribe(
  //     (data) => {
  //       this.totalResults = data.TotalHos;
  //       this.totalHosWithIcd9 = data.TotalHosWithIcd9;
  //       this.Icd9Percentage = data.Icd9Percentage;
  //       //this.TotalHosLabResultover180 = data.TotalHosLabResultover180;
  //       //this.labResultOver180Percentage = data.LabResultover180Percentage;
  //       this.TotalHosInsulin = data.TotalHosInsulin;
  //       this.insulinPercentage = data.InsulinPercentage;
  //       this.HemoglobinAbove8Count = data.HemoglobinAbove8Count;
  //       this.HemoglobinAbove8Percentage = data.HemoglobinAbove8Percentage;
  //     },
  //     (error) => {
  //       console.error('Error fetching general data:', error);
  //     }
  //   );
  // }

  fetchLabResultsAboveThreshold(): void {
    this.http
      .get<any[]>(`${environment.apiUrl}/DiabetesConsultation/LabResultsAboveThreshold`)
      .subscribe(
        (data) => {
          this.originalDataSource1 = data;
          this.TotalHosLabResultover180 = data.length;
          if (this.medicalRecordsCount > 0) {
            this.labResultOver180Percentage =
              (this.TotalHosLabResultover180 / this.medicalRecordsCount) * 100;
          } else {
            this.labResultOver180Percentage = 0;
          }
          this.applyGlobalSourceTableFilter();
          this.applyGlobalDateFilter();
          

        },
        (error) => {
          console.error('Error fetching Lab Results Above Threshold:', error);
        }
      );
  }

  fetchInsulinData(): void {
    this.http
      .get<any[]>(`${environment.apiUrl}/DiabetesConsultation/Insulin`)
      .subscribe(
        (data) => {
          this.originalDataSource3 = data;
          this.applyGlobalSourceTableFilter();
          this.applyGlobalDateFilter();

        },
        (error) => {
          console.error('Error fetching insulin data:', error);
        }
      );
  }

  fetchDiagnosisData(): void {
    this.http
      .get<any[]>(`${environment.apiUrl}/DiabetesConsultation/Diagnosis`)
      .subscribe(
        (data) => {
          this.originalDataSource4 = data;
          this.applyGlobalSourceTableFilter();
          this.applyGlobalDateFilter();

        },
        (error) => {
          console.error('Error fetching Diagnosis data:', error);
        }
      );
  }

  fetchHemoglobinAbove8(): void {
    this.http
      .get<any[]>(`${environment.apiUrl}/DiabetesConsultation/HemoglobinAbove8`)
      .subscribe(
        (data) => {
          this.originalDataSourceHemoglobin = data;
          this.applyGlobalSourceTableFilter();
          this.applyGlobalDateFilter();

        },
        (error) => {
          console.error('Error fetching Hemoglobin Above 8 data:', error);
        }
      );
  }

  fetchAllConsiliums(): void {
    this.http
      .get<any[]>(`${environment.apiUrl}/DiabetesConsultation/AllConsiliums`)
      .subscribe(
        (data) => {
          this.originalDataSourceAllConsiliums = data;
          this.applyGlobalSourceTableFilter();
          this.applyGlobalDateFilter();

        },
        (error) => {
          console.error('Error fetching All Consiliums data:', error);
        }
      );
  }
  fetchLabResultsBelow70(): void {
    this.http
      .get<any[]>(`${environment.apiUrl}/DiabetesConsultation/LabResultBelow70`)
      .subscribe(
        (data) => {
          this.originalDataSourceBelow70 = data;
          this.applyGlobalSourceTableFilter();
          this.applyGlobalDateFilter();
        },
        (error) => {
          console.error('Error fetching Lab Results Below 70:', error);
        }
      );
  }
  
  applyFilter(filterValue: string): void {
    this.dataSource1.filter = filterValue.trim().toLowerCase();
    if (this.dataSource1.paginator) {
      this.dataSource1.paginator.firstPage();
    }
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;

    if (this.isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }

    localStorage.setItem('darkMode', this.isDarkMode.toString());
  }

  exportToExcel(): void {
    const excelData = this.convertToExcelFormat(this.filteredData);

    const blob = new Blob([excelData], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'filtered_data.xlsx';
    link.click();
  }

  convertToExcelFormat(data: any[]): Blob {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = {
      Sheets: { data: worksheet },
      SheetNames: ['data'],
    };
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    return new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  applyGlobalSourceTableFilter(): void {
    const filter = this.globalSourceTableFilter;

    this.dataSource1.data =
      filter === 'All'
        ? this.originalDataSource1
        : this.originalDataSource1.filter((item) => item.Source_Table === filter);

    this.dataSource3.data =
      filter === 'All'
        ? this.originalDataSource3
        : this.originalDataSource3.filter((item) => item.Source_Table === filter);

    this.dataSource4.data =
      filter === 'All'
        ? this.originalDataSource4
        : this.originalDataSource4.filter((item) => item.Source_Table === filter);

    this.dataSourceHemoglobin.data =
      filter === 'All'
        ? this.originalDataSourceHemoglobin
        : this.originalDataSourceHemoglobin.filter((item) => item.Source_Table === filter);

    this.dataSourceAllConsiliums.data =
      filter === 'All'
        ? this.originalDataSourceAllConsiliums
        : this.originalDataSourceAllConsiliums.filter((item) => item.Source_Table === filter);

    this.dataSourceBelow70.data =
      filter === 'All'
        ? this.originalDataSourceBelow70
        : this.originalDataSourceBelow70.filter((item) => item.Source_Table === filter);
        this.recalculateLabResultsPercentage();

  }

  onGlobalSourceTableToggleChange(value: string): void {
    this.globalSourceTableFilter = value;
    this.applyGlobalSourceTableFilter();
  }
  // Method to apply global date filter
  applyGlobalDateFilter(): void {
    const { start, end } = this.globalDateFilter;
  
    const isWithinDateRange = (date: Date | null): boolean => {
      if (!date) return true; // If date is null, include the record
      const recordDate = new Date(date);
      if (start && recordDate < start) return false;
      if (end && recordDate > end) return false;
      return true;
    };
  
    // Apply filter for all tables using Admission_Date
    this.dataSource1.data = this.originalDataSource1.filter((item) =>
      isWithinDateRange(item.Admission_Date)
    );
    this.dataSource3.data = this.originalDataSource3.filter((item) =>
      isWithinDateRange(item.Admission_Date)
    );
    this.dataSource4.data = this.originalDataSource4.filter((item) =>
      isWithinDateRange(item.Admission_Date)
    );
    this.dataSourceHemoglobin.data = this.originalDataSourceHemoglobin.filter((item) =>
      isWithinDateRange(item.Admission_Date)
    );
  
    // Apply filter for AllConsiliums using Entry_Date
    this.dataSourceAllConsiliums.data = this.originalDataSourceAllConsiliums.filter((item) =>
      isWithinDateRange(item.Entry_Date)
    );

    this.dataSourceBelow70.data = this.originalDataSourceBelow70.filter((item) =>
    isWithinDateRange(item.Admission_Date)
  );
  this.fetchMedicalRecordsCount();
  this.recalculateLabResultsPercentage();

  }
  

  // Handle date range changes
  onDateRangeChange(start: Date | null, end: Date | null): void {
    this.globalDateFilter = { start, end };
    this.applyGlobalDateFilter();
    this.fetchMedicalRecordsCount(); // Re-fetch data based on the updated filters

  }

    // Add this method to fetch the medical records count
    fetchMedicalRecordsCount(): void {
      const startDate = this.globalDateFilter.start
        ? this.globalDateFilter.start.toISOString()
        : null;
      const endDate = this.globalDateFilter.end
        ? this.globalDateFilter.end.toISOString()
        : null;
  
      this.http
        .get<{ MedicalRecordCount: number }>(
          `${environment.apiUrl}/DiabetesConsultation/MedicalRecordsCount`,
          {
            params: {
              startDate: startDate || '',
              endDate: endDate || '',
            },
          }
        )
        .subscribe(
          (data) => {
            this.medicalRecordsCount = data.MedicalRecordCount;
          },
          (error) => {
            console.error('Error fetching Medical Records Count:', error);
          }
        );
    }

    recalculateLabResultsPercentage(): void {
      // Calculate the filtered total
      this.TotalHosLabResultover180 = this.dataSource1.data.length;
    
      // Recalculate the percentage based on the filtered total and the overall medical records count
      if (this.medicalRecordsCount > 0) {
        this.labResultOver180Percentage = (this.TotalHosLabResultover180 / this.medicalRecordsCount) * 100;
      } else {
        this.labResultOver180Percentage = 0;
      }
    }

    applyFilters(): void {
      // Set the global date filter
      this.globalDateFilter = { start: this.startDate, end: this.endDate };
    
      // Apply all filters
      this.applyGlobalSourceTableFilter();
      this.applyGlobalDateFilter();
    
      // Recalculate percentages
      this.recalculateLabResultsPercentage();
    }
    resetFilters(): void {
      // Reset date filters and source table filter
      this.startDate = null;
      this.endDate = null;
      this.globalSourceTableFilter = 'All';
    
      // Reset the global date filter
      this.globalDateFilter = { start: null, end: null };
    
      // Reset data to original
      this.dataSource1.data = [...this.originalDataSource1];
      this.dataSource3.data = [...this.originalDataSource3];
      this.dataSource4.data = [...this.originalDataSource4];
      this.dataSourceHemoglobin.data = [...this.originalDataSourceHemoglobin];
      this.dataSourceAllConsiliums.data = [...this.originalDataSourceAllConsiliums];
    
      // Recalculate percentages
      this.recalculateLabResultsPercentage();
    }
    
}
