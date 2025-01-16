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

  CurrentHospitalizations: number = 0; // Total with non-null Release_Date
  TotalHospitalizations: number = 0;  // Total with null Release_Date
  FilteredCurrentHospitalizations: number = 0; // Temporary filtered count for CurrentHospitalizations
  FilteredTotalHospitalizations: number = 0;   // Temporary filtered count for TotalHospitalizations
  

 // Applied filter values
 startDate: Date | null = null;
 endDate: Date | null = null;
 globalSourceTableFilter: string = 'All';

    // Temporary values for the date pickers and filter
    tempStartDate: Date | null = null;
    tempEndDate: Date | null = null;
    tempGlobalSourceTableFilter: string = 'All';

  // Global filter value
 // Global date range filter
 globalDateFilter: { start: Date | null; end: Date | null } = { start: null, end: null };

  // Store original data for each table
  originalDataSource1: any[] = [];
  originalDataSource3: any[] = [];
  originalDataSource4: any[] = [];
  originalDataSourceHemoglobin: any[] = [];
  originalDataSourceAllConsiliums: any[] = [];
  originalDataSourceBelow70: any[] = [];


  selectedSourceFilter: string = 'All'; // Temporary storage for selected toggle


  displayedColumns: string[] = [
    'Admission_No',
    'Admission_Date',
    'First_Name',
    'Last_Name',
    'Count_Above_180_Less_48h',
    'Release_Date', 
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
    'Release_Date',
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
    'Release_Date', // Use unique identifier
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
    this.fetchHosCount(); 


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
  //       this.CurrentHospitalizations = data.TotalHos;
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
          this.recalculateLabResultsPercentage();
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
        : filter === 'CurrentHospitalizations'
        ? this.originalDataSource1.filter((item) => item.Release_Date === null)
        : this.originalDataSource1.filter((item) => item.Release_Date !== null);
  
    // Update hospitalization counts based on the filtered data
    this.CurrentHospitalizations = this.dataSource1.data.filter(
      (item) => item.Release_Date === null
    ).length;
  
    this.TotalHospitalizations = this.originalDataSource1.length;
  
    // Recalculate percentage for gauges
    this.recalculateLabResultsPercentage();
  }
  
  
  

  onGlobalSourceTableToggleChange(value: string): void {
    this.globalSourceTableFilter = value;
  
    switch (value) {
      case 'CurrentHospitalizations':
        this.dataSource1.data = this.originalDataSource1.filter(
          (item) => item.Release_Date === null
        );
        break;
  
      case 'PastHospitalizations':
        this.dataSource1.data = this.originalDataSource1.filter(
          (item) => item.Release_Date !== null
        );
        break;
  
      default:
        this.dataSource1.data = [...this.originalDataSource1];
        break;
    }
  
    // Recalculate percentage after filter change
    this.recalculateLabResultsPercentage();
    this.applyGlobalDateFilter();

  }
  

  
updateGaugeValues(): void {
  if (this.FilteredTotalHospitalizations > 0) {
    this.labResultOver180Percentage =
      (this.FilteredCurrentHospitalizations / this.FilteredTotalHospitalizations) * 100;
  } else {
    this.labResultOver180Percentage = 0;
  }
}

  
  
  
  
  // Method to apply global date filter
  applyGlobalDateFilter(): void {
    const { start, end } = this.globalDateFilter;
  
    const isWithinDateRange = (date: Date | null): boolean => {
      if (!date) return true; // Include records with null dates
      const recordDate = new Date(date);
      if (start && recordDate < start) return false;
      if (end && recordDate > end) return false; // Include the end date
      return true;
    };
  
    // Filter based on Admission_Date for most tables
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
  
    // Special case: Entry_Date for AllConsiliums
    this.dataSourceAllConsiliums.data = this.originalDataSourceAllConsiliums.filter((item) =>
      isWithinDateRange(item.Entry_Date)
    );
  
    this.dataSourceBelow70.data = this.originalDataSourceBelow70.filter((item) =>
      isWithinDateRange(item.Admission_Date)
    );
  
    // Recalculate counts and percentages
    this.fetchHosCount(); // Update counts
    this.recalculateLabResultsPercentage(); // Update percentages
  
    console.log('Global Date Filter Applied:', this.globalDateFilter);
  }
  
  
  
  
  

  // Handle date range changes
  onDateRangeChange(start: Date | null, end: Date | null): void {
    console.log('Start Date:', start);
    console.log('End Date:', end);
  
    if (start && end && start > end) {
      console.error('Start Date cannot be after End Date');
      return;
    }
  
    this.globalDateFilter = { start, end };
    this.applyGlobalDateFilter(); // Apply the date filter logic
  }
    // Add this method to fetch the medical records count
    fetchHosCount(): void {
      const startDate = this.globalDateFilter.start
        ? this.globalDateFilter.start.toISOString()
        : null;
      const endDate = this.globalDateFilter.end
        ? this.globalDateFilter.end.toISOString()
        : null;
    
      this.http
        .get<{ NullReleaseDateCount: number; NonNullReleaseDateCount: number }>(
          `${environment.apiUrl}/DiabetesConsultation/totalHospitalizations`,
          {
            params: {
              startDate: startDate || '',
              endDate: endDate || '',
            },
          }
        )
        .subscribe(
          (data) => {
            console.log('API Response:', data);
    
            // Assign values from the API response
            this.CurrentHospitalizations = data.NullReleaseDateCount;
            this.TotalHospitalizations = data.NonNullReleaseDateCount;
    
            // Recalculate percentages based on both API data and filters
            this.recalculateLabResultsPercentage();
          },
          (error) => {
            console.error('Error fetching Hospitalization Counts:', error);
          }
        );
    }
    recalculateLabResultsPercentage(): void {
      const filteredCount = this.dataSource1.data.length;
    
      // Use the appropriate denominator based on the global filter
      const denominator =
        this.globalSourceTableFilter === 'CurrentHospitalizations'
          ? this.CurrentHospitalizations
          : this.globalSourceTableFilter === 'PastHospitalizations'
          ? this.TotalHospitalizations - this.CurrentHospitalizations
          : this.TotalHospitalizations;
    
      // Calculate percentage
      this.labResultOver180Percentage =
        denominator > 0 ? (filteredCount / denominator) * 100 : 0;
    
      console.log('Filtered Count:', filteredCount);
      console.log('Denominator:', denominator);
      console.log('Global Source Filter:', this.globalSourceTableFilter);
      console.log('Lab Result Percentage:', this.labResultOver180Percentage);
    }
    
    
    
    
    
    
    applyFilters(): void {
      const { start, end } = this.globalDateFilter;
    
      const isWithinDateRange = (date: Date | null): boolean => {
        if (!date) return true; // Include if no date range filter is applied
        const recordDate = new Date(date);
        if (start && recordDate < start) return false;
        if (end && recordDate > end) return false; // Include the end date
        return true;
      };
    
      console.log('Applying Filters:');
      console.log('Start Date:', start);
      console.log('End Date:', end);
      console.log('Global Source Filter:', this.globalSourceTableFilter);
    
      this.dataSource1.data = this.originalDataSource1.filter((item) => {
        const withinDateRange = isWithinDateRange(item.Admission_Date);
    
        if (this.globalSourceTableFilter === 'CurrentHospitalizations') {
          console.log('Filtering for CurrentHospitalizations');
          return item.Release_Date === null && withinDateRange;
        } else if (this.globalSourceTableFilter === 'PastHospitalizations') {
          console.log('Filtering for PastHospitalizations');
          return item.Release_Date !== null && withinDateRange;
        } else {
          console.log('Filtering for All Records');
          return withinDateRange;
        }
      });
    
      console.log('Filtered Data:', this.dataSource1.data);
      console.log('Filtered Count:', this.dataSource1.data.length);
    
      // Fetch updated counts and recalculate percentages
      this.recalculateLabResultsPercentage();
      this.fetchHosCount();
    }
    
    
    
    
    // Update the selected source filter when a toggle is clicked
    onSourceFilterChange(filter: string): void {
      this.selectedSourceFilter = filter;
    }
    
    resetFilters(): void {
      // Reset date filters
      this.startDate = null;
      this.endDate = null;
      this.globalDateFilter = { start: null, end: null };
      this.globalSourceTableFilter = 'All';
    
      // Reset data sources to their original values
      this.dataSource1.data = [...this.originalDataSource1];
      this.dataSource3.data = [...this.originalDataSource3];
      this.dataSource4.data = [...this.originalDataSource4];
      this.dataSourceHemoglobin.data = [...this.originalDataSourceHemoglobin];
      this.dataSourceAllConsiliums.data = [...this.originalDataSourceAllConsiliums];
      this.dataSourceBelow70.data = [...this.originalDataSourceBelow70];
    
      // Reset hospitalization counts
      this.fetchHosCount(); // Re-fetch counts based on the original data
    
      // Recalculate lab results percentage
      this.recalculateLabResultsPercentage();
    
      // Log reset confirmation for debugging
      console.log('Filters have been reset to default state.');
    }
    
    get denominator(): number {
      switch (this.globalSourceTableFilter) {
        case 'CurrentHospitalizations': // מאושפזים
          return this.CurrentHospitalizations;
    
        case 'PastHospitalizations': // מטופלי עבר
          return this.TotalHospitalizations - this.CurrentHospitalizations;
    
        case 'All': // הכל
        default:
          return this.TotalHospitalizations;
      }
    }
    
    get filteredCount(): number {
      return this.dataSource1.filteredData.length;
    }
    
}
