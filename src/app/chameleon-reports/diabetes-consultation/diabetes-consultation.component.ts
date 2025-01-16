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
  NullReleaseDateCount: number = 0;
  NonNullReleaseDateCount: number = 0;
  labResultBelow70Percentage: number = 0;

  labResultsPercentage: number = 0; // For בדיקות מעבדה
below70Percentage: number = 0; // For סוכר מתחת ל-70

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
  insulinColumns: string[] = [
    'Admission_No',
    'Admission_Date',
    'Id_Num',
    'First_Name',
    'Last_Name',
    'Name',
    'Main_Drug',
    'Entry_Date',
    'Release_Date',
  ];
  DiagnosisICD9: string[] = [
  
    'Admission_No',
    'Admission_Date',
    'Id_Num',
    'First_Name',
    'Last_Name',
    'ICD9',
    'Name',
    'Release_Date'
    //'Entry_Date',
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
    this.fetchLabResultsAboveThreshold();
    this.fetchInsulinData();
    this.fetchDiagnosisData();
    this.fetchHemoglobinAbove8();
    this.fetchAllConsiliums();
    this.fetchLabResultsBelow70();
  
    // Fetch initial hospitalization counts
    this.fetchHosCount(null, null);
  
    // Set default values for filters
    this.globalDateFilter = { start: null, end: null };
    this.tempGlobalSourceTableFilter = 'All';
  
    // Initialize Dark Mode
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    this.isDarkMode = savedDarkMode;
  
    if (this.isDarkMode) {
      document.body.classList.add('dark-mode');
    }
    
    // Ensure gauges are updated after fetching data
    setTimeout(() => {
      this.updateGaugeValues();
    }, 0); // Wait for data fetching to complete
    

    
  
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
          this.dataSource1.data = data; // Update table data source
          this.TotalHosLabResultover180 = data.length;
  
          this.updateGaugeValues(); // Update gauges
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

//icd9
fetchDiagnosisData(): void {
  this.http
    .get<any[]>(`${environment.apiUrl}/DiabetesConsultation/Diagnosis`)
    .subscribe(
      (data) => {
        this.originalDataSource4 = data;
        this.dataSource4.data = data;
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
  
    // Filter data for the ICD9 table
    this.dataSource4.data =
      filter === 'All'
        ? this.originalDataSource4
        : filter === 'CurrentHospitalizations'
        ? this.originalDataSource4.filter((item) => item.Release_Date === null)
        : this.originalDataSource4.filter((item) => item.Release_Date !== null);
  
    console.log('Filtered dataSource4 after hospitalization filter:', this.dataSource4.data);
  
    // Filter data for the Below 70 table
    this.dataSource1.data =
      filter === 'All'
        ? this.originalDataSource1
        : filter === 'CurrentHospitalizations'
        ? this.originalDataSource1.filter((item) => item.Release_Date === null)
        : this.originalDataSource1.filter((item) => item.Release_Date !== null);
  
    // Filter data for the Insulin table (dataSource3)
    this.dataSource3.data =
      filter === 'All'
        ? this.originalDataSource3
        : filter === 'CurrentHospitalizations'
        ? this.originalDataSource3.filter((item) => item.Release_Date === null)
        : this.originalDataSource3.filter((item) => item.Release_Date !== null);
  
    console.log('Filtered dataSource3 after hospitalization filter:', this.dataSource3.data);
  
    // Update hospitalization counts based on the filtered data
    this.CurrentHospitalizations = this.dataSource1.data.filter(
      (item) => item.Release_Date === null
    ).length;
  
    this.TotalHospitalizations = this.originalDataSource1.length;
  
    // Add any Insulin-specific counts or metrics here (if needed)
    const insulinCurrentCount = this.dataSource3.data.filter(
      (item) => item.Release_Date === null
    ).length;
  
    const insulinTotalCount = this.originalDataSource3.length;
  
    console.log('Insulin Current Count:', insulinCurrentCount);
    console.log('Insulin Total Count:', insulinTotalCount);
  
    // Recalculate percentage for gauges (if applicable)
    this.recalculateLabResultsPercentage();
  }
  
  
  

  onGlobalSourceTableToggleChange(value: string): void {
    this.globalSourceTableFilter = value;
  
    // switch (value) {
    //   case 'CurrentHospitalizations':
    //     this.dataSource1.data = this.originalDataSource1.filter(
    //       (item) => item.Release_Date === null
    //     );
    //     break;
  
    //   case 'PastHospitalizations':
    //     this.dataSource1.data = this.originalDataSource1.filter(
    //       (item) => item.Release_Date !== null
    //     );
    //     break;
  
    //   default:
    //     this.dataSource1.data = [...this.originalDataSource1];
    //     break;
    // }
  
    // Recalculate percentage after filter change
    this.recalculateLabResultsPercentage();
    this.applyGlobalDateFilter();

  }
  

  

  updateGaugeValues(): void {
    // Calculate Lab Results Percentage
    const labTableLength = this.dataSource1.data.length; // Data length for בדיקות מעבדה
    const labDenominator = this.globalSourceTableFilter === 'מאושפזים' ? this.NullReleaseDateCount : this.NonNullReleaseDateCount;
    this.labResultsPercentage = labDenominator > 0 ? (labTableLength / labDenominator) * 100 : 0;
  
    console.log('בדיקות מעבדה:', {
      TableLength: labTableLength,
      Denominator: labDenominator,
      Percentage: this.labResultsPercentage,
    });
  
    // Calculate Below 70 Percentage
    const below70TableLength = this.dataSourceBelow70.data.length; // Data length for סוכר מתחת ל-70
    const below70Denominator = this.globalSourceTableFilter === 'מאושפזים' ? this.NullReleaseDateCount : this.NonNullReleaseDateCount;
    this.below70Percentage = below70Denominator > 0 ? (below70TableLength / below70Denominator) * 100 : 0;
  
    console.log('סוכר מתחת ל-70:', {
      TableLength: below70TableLength,
      Denominator: below70Denominator,
      Percentage: this.below70Percentage,
    });
  
    // Calculate ICD9 Percentage
    const icd9TableLength = this.dataSource4.data.length; // Data length for מטופלים עם אבחנה
    const icd9Denominator = this.globalSourceTableFilter === 'מאושפזים' ? this.NullReleaseDateCount : this.NonNullReleaseDateCount;
    this.Icd9Percentage = icd9Denominator > 0 ? (icd9TableLength / icd9Denominator) * 100 : 0;
  
    console.log('מטופלים עם אבחנה:', {
      TableLength: icd9TableLength,
      Denominator: icd9Denominator,
      Percentage: this.Icd9Percentage,
    });
  }
  
  

  
  
  
  isWithinDateRange(date: Date | null): boolean {
    if (!date) return true; // Include records with null dates
    const recordDate = new Date(date);
    if (this.globalDateFilter.start && recordDate < this.globalDateFilter.start) return false;
    if (this.globalDateFilter.end && recordDate > this.globalDateFilter.end) return false;
    return true;
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
  
    // Filter data for each table
    this.dataSource1.data = this.originalDataSource1.filter((item) =>
      isWithinDateRange(item.Admission_Date)
    );
  
    this.dataSource3.data = this.originalDataSource3.filter((item) =>
      isWithinDateRange(item.Admission_Date)
    );
  
    this.dataSource4.data = this.originalDataSource4.filter((item) =>
      isWithinDateRange(item.Admission_Date)
    );
  
    console.log('Filtered dataSource3 after date filter:', this.dataSource3.data);
  
    this.dataSourceHemoglobin.data = this.originalDataSourceHemoglobin.filter((item) =>
      isWithinDateRange(item.Admission_Date)
    );
  
    this.dataSourceAllConsiliums.data = this.originalDataSourceAllConsiliums.filter((item) =>
      isWithinDateRange(item.Entry_Date)
    );
  
    this.dataSourceBelow70.data = this.originalDataSourceBelow70.filter((item) =>
      isWithinDateRange(item.Admission_Date)
    );
  
    // Recalculate counts and percentages
    this.recalculateLabResultsPercentage();
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
    fetchHosCount(startDate: Date | null, endDate: Date | null): void {
      const start = startDate ? startDate.toISOString() : null;
      const end = endDate ? endDate.toISOString() : null;
    
      this.http
        .get<{ NullReleaseDateCount: number; NonNullReleaseDateCount: number }>(
          `${environment.apiUrl}/DiabetesConsultation/totalHospitalizations`,
          { params: { startDate: start || '', endDate: end || '' } }
        )
        .subscribe(
          (data) => {
            this.NullReleaseDateCount = data.NullReleaseDateCount;
            this.NonNullReleaseDateCount = data.NonNullReleaseDateCount;
    
            console.log('Fetched Hospitalization Counts:', data);
    
            // Update gauges after fetching hospitalization counts
            this.updateGaugeValues();
          },
          (error) => {
            console.error('Error fetching hospitalization counts:', error);
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
      this.globalSourceTableFilter = this.tempGlobalSourceTableFilter;
    
      const { start, end } = this.globalDateFilter;
      console.log('Applying Filters:', {
        StartDate: start,
        EndDate: end,
        SourceFilter: this.globalSourceTableFilter,
      });
    
      // Fetch hospitalization counts for the filtered date range
      this.fetchHosCount(start, end);
    
      // Filter data based on date range for each table
      const filteredData = this.originalDataSource1.filter((item) =>
        this.isWithinDateRange(item.Admission_Date)
      );
    
      const filteredBelow70 = this.originalDataSourceBelow70.filter((item) =>
        this.isWithinDateRange(item.Admission_Date)
      );
    
      const filteredICD9 = this.originalDataSource4.filter((item) =>
        this.isWithinDateRange(item.Admission_Date)
      );
    
      const filteredInsulin = this.originalDataSource3.filter((item) =>
        this.isWithinDateRange(item.Admission_Date)
      );
    
      if (this.globalSourceTableFilter === 'מאושפזים') {
        // Filter for "מאושפזים" (current hospitalizations)
        this.dataSource1.data = filteredData.filter((item) => item.Release_Date === null);
        this.dataSourceBelow70.data = filteredBelow70.filter((item) => item.Release_Date === null);
        this.dataSource4.data = filteredICD9.filter((item) => item.Release_Date === null);
        this.dataSource3.data = filteredInsulin.filter((item) => item.Release_Date === null);
      } else {
        // Filter for "All"
        this.dataSource1.data = filteredData;
        this.dataSourceBelow70.data = filteredBelow70;
        this.dataSource4.data = filteredICD9;
        this.dataSource3.data = filteredInsulin;
      }
    
      // Update gauge values
      this.updateGaugeValues();
    
      console.log('Filters applied successfully!');
      console.log('Filtered Insulin Data:', this.dataSource3.data);
    }
    
    
    
    updateHospitalizationCounts(): void {
      this.CurrentHospitalizations = this.dataSource1.data.filter((item) => item.Release_Date === null).length;
      this.TotalHospitalizations = this.originalDataSource1.length;
    
      console.log('Updated Current Hospitalizations:', this.CurrentHospitalizations);
      console.log('Updated Total Hospitalizations:', this.TotalHospitalizations);
    }
    
    // Update the selected source filter when a toggle is clicked
    onSourceFilterChange(filter: string): void {
      this.tempGlobalSourceTableFilter = filter;
      console.log('Temporary Source Filter Updated:', this.tempGlobalSourceTableFilter);
    }
    resetFilters(): void {
      console.log('Resetting filters...');
    
      // Reset date range
      this.globalDateFilter = { start: null, end: null };
    
      // Reset toggle filter
      this.globalSourceTableFilter = 'All';
      this.tempGlobalSourceTableFilter = 'All';
    
      // Fetch initial hospitalization counts (without any filters)
      this.fetchHosCount(null, null);
    
      // Reset data sources to their original values
      this.dataSource1.data = [...this.originalDataSource1];
      this.dataSource3.data = [...this.originalDataSource3];
      this.dataSource4.data = [...this.originalDataSource4];
      this.dataSourceHemoglobin.data = [...this.originalDataSourceHemoglobin];
      this.dataSourceAllConsiliums.data = [...this.originalDataSourceAllConsiliums];
      this.dataSourceBelow70.data = [...this.originalDataSourceBelow70];
    
      // Recalculate gauge values
      this.updateGaugeValues();
    
      console.log('Filters have been reset to default state.');
    }
    
    
    get denominator(): number {
      switch (this.globalSourceTableFilter) {
        case 'מאושפזים': // Current Hospitalizations
          return this.CurrentHospitalizations;
    
        case 'PastHospitalizations': // Past Hospitalizations
          return this.TotalHospitalizations - this.CurrentHospitalizations;
    
        case 'All': // All records
        default:
          return this.TotalHospitalizations;
      }
    }
    
    get filteredCount(): number {
      return this.dataSource1.filteredData.length;
    }
    
  
    
    
    
    
    
    
     
    
}
