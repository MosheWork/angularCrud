import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { FormGroup, FormControl } from '@angular/forms';
import * as XLSX from 'xlsx';
import { environment } from '../../../environments/environment';
import { Renderer2 } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { LabResultsDetailDialogComponent } from '../diabetes-consultation/lab-results-detail-dialog/lab-results-detail-dialog.component'; // adjust path

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
  labResultsWithoutInsulinPercentage: number = 0;
 


  sugar180DiabetesPercentage: number = 0; // סוכר 180 וחולה סוכרת
sugar70DiabetesPercentage: number = 0; // סוכר 70 וחולה סוכרת
  labResultsPercentage: number = 0; // For בדיקות מעבדה
below70Percentage: number = 0; // For סוכר מתחת ל-70
diabeticFootEstimationPercentage: number = 0;
sugar180AllPercentage: number = 0; 
icd9WithoutEstimationPercentage: number = 0;
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
  originalSugerAbove180: any[] = [];
  originalDataSource3: any[] = [];
  originalDataSourceDiagnosisICD9: any[] = [];
  originalDataSourceHemoglobin: any[] = [];
  originalDataSourceAllConsiliums: any[] = [];
  originalDataSourceBelow70: any[] = [];
  originalDiabeticFootEstimation: any[] = [];
  originalLabResultsWithoutInsulin: any[] = [];
  originalPatientWithICD9AndDontHaveDiabetesEstimation: any[] = [];
  originalDiabeticPatientsWithCatheterOrders: any[] = [];
  isLoading:boolean=true;


  selectedSourceFilter: string = 'All'; // Temporary storage for selected toggle

  displayedColumnsDiabeticFootEstimation: string[] = [
    'Admission_No',
    'Admission_Date',
    'Release_Date',
    'Hospitalization_Patient',
    'Admission_Medical_Record',
    'Id_Num',
    'First_Name',
    'Last_Name',
    'Grade',
    'UnitName',
  ];

  sugerAbove180Columns: string[] = [
    'Admission_No',
    'Admission_Date',
    'First_Name',
    'Last_Name',
    'Count_Above_180_Less_48h',
    'Release_Date', 
    'UnitName'
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
    'UnitName',
  ];
  DiagnosisICD9: string[] = [
  
    'Admission_No',
    'Admission_Date',
    'Id_Num',
    'First_Name',
    'Last_Name',
    'ICD9',
    'Name',
    'Release_Date',
    'UnitName',
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
    'Release_Date', 
    'UnitName',
  ];
  displayedColumnsLabResultsWithoutInsulin: string[] = [
    'Admission_No',
    'Admission_Date',
    'First_Name',
    'Last_Name',
    'Count_Above_180_Less_48h',
    'Release_Date',
    'UnitName'
  ];
  
  DiabeticFootEstimationOnlHosDataSource = new MatTableDataSource<any>();
displayedColumnsDiabeticFootEstimationOnlHos: string[] = [
  'Admission_No',
  'Admission_Date',
  'Release_Date',
  //'Hospitalization_Patient',
  'Admission_Medical_Record',
  'Id_Num',
  'First_Name',
  'Last_Name',
  'UnitName',
  'Unit',
];

displayedColumnsPatientWithICD9AndDontHaveDiabetesEstimation: string[] = [
  'Admission_No',
  'Admission_Date',
  
  //'Admission_Medical_Record',
  //'Id_Num',
  'First_Name',
  'Last_Name',
  'UnitName',
  'Release_Date',
 // 'Unit',
];
displayedColumnsDiabeticPatientsWithCatheterOrders: string[] = [
  'Admission_No',
  'Admission_Date',
  //'Id_Num',
  'First_Name',
  'Last_Name',
  'ICD9',
  'DiagnosisName',
  //'Entry_Date',
  'Release_Date',
  'Parameter',
  'UnitName'
];

departments: string[] = [
  'אשפוז יום כירורגי', 'מחלקת שיקום ילדים', 'מחלקת ילדים', 'מחלקת פנימית ב', 
  'מחלקת פנימית א', 'מחלקת נוירולוגיה ושבץ מוחי', 'המחלקה לגריאטריה שיקומית',
  'מחלקת אורתופדיה', 'מחלקת נשים', 'מחלקת עיניים', 'מחלקת אף אוזן גרון',
  'מחלקת פה ולסת', 'טיפול נמרץ כללי', 'מחלקת קרדיולוגיה', 'טיפול נמרץ לב',
  'מחלקת כירורגית ילדים', 'מחלקת כירורגיה', 'מחלקת אורולוגיה', 'כירורגית לב',
  'כירורגית חזה', 'כירורגית כלי דם', 'טיפול נמרץ כירורגית לב', 
  'טיפול נמרץ כירורגית כלי דם', 'טיפול נמרץ כירורגית חזה', 'מחלקת יולדות',
  'המחלקה לרפואת האם והעובר', 'טיפול נמרץ בפג ובילוד', 'מחלקת ילודים', 
  'טיפול נמרץ ילדים', 'מחלקת שיקום כללי'
];

selectedDepartments: string[] = []; // for user selection

  sugerAbove180 = new MatTableDataSource<any>();
  InsulinDataSource = new MatTableDataSource<any>();
  DiagnosisICD9dataSource = new MatTableDataSource<any>();
  dataSourceHemoglobin = new MatTableDataSource<any>();
  dataSourceAllConsiliums = new MatTableDataSource<any>();
  dataSourceBelow70 = new MatTableDataSource<any>();
  DiabeticFootEstimationDataSource = new MatTableDataSource<any>();
  LabResultsWithoutInsulinDataSource = new MatTableDataSource<any>();
  PatientWithICD9AndDontHaveDiabetesEstimationDataSource = new MatTableDataSource<any>();
  DiabeticPatientsWithCatheterOrdersDataSource = new MatTableDataSource<any>();


  filterForm: FormGroup = new FormGroup({
    globalFilter: new FormControl(''),
  });

  @ViewChild('paginator1') paginator1!: MatPaginator;
  @ViewChild('Ensoleen') Ensoleen!: MatPaginator;
  @ViewChild('paginator4') paginator4!: MatPaginator;
  @ViewChild('paginatorHemoglobin') paginatorHemoglobin!: MatPaginator;
  @ViewChild('paginatorAllConsiliums') paginatorAllConsiliums!: MatPaginator;
  @ViewChild('paginatorBelow70') paginatorBelow70!: MatPaginator;
  @ViewChild('paginatorDiabeticFootEstimation', { static: true }) paginatorDiabeticFootEstimation!: MatPaginator;
  @ViewChild('sortDiabeticFootEstimation', { static: true }) sortDiabeticFootEstimation!: MatSort;
  @ViewChild('paginatorWithoutInsulin') paginatorWithoutInsulin!: MatPaginator;
  @ViewChild('sortWithoutInsulin') sortWithoutInsulin!: MatSort;
  @ViewChild('paginatorICD9NoEstimation', { static: true }) paginatorICD9NoEstimation!: MatPaginator;
  @ViewChild('sortICD9NoEstimation', { static: true }) sortICD9NoEstimation!: MatSort;
  @ViewChild('paginatorCatheterOrders', { static: true }) paginatorCatheterOrders!: MatPaginator;
@ViewChild('sortCatheterOrders', { static: true }) sortCatheterOrders!: MatSort;

  @ViewChild('sort1') sort1!: MatSort;
  @ViewChild('sort3', { static: false }) sort3!: MatSort;
  @ViewChild('sort4') sort4!: MatSort;
  @ViewChild('sortHemoglobin') sortHemoglobin!: MatSort;
  @ViewChild('sortAllConsiliums') sortAllConsiliums!: MatSort;
  @ViewChild('sortBelow70') sortBelow70!: MatSort;
  @ViewChild('paginatorDiabeticFootEstimationOnlHos', { static: true }) paginatorDiabeticFootEstimationOnlHos!: MatPaginator;
  @ViewChild('sortDiabeticFootEstimationOnlHos', { static: true }) sortDiabeticFootEstimationOnlHos!: MatSort;



  constructor(private http: HttpClient, private renderer: Renderer2,private dialog: MatDialog) {}

  ngOnInit(): void {
    this.fetchLabResultsAboveThreshold();
    this.fetchInsulinData();
    this.fetchDiagnosisData();
    this.fetchHemoglobinAbove8();
    this.fetchAllConsiliums();
    this.fetchLabResultsBelow70();
    this.fetchDiabeticFootEstimation(); // Fetch Diabetic Foot Estimation data
    this.fetchDiabeticFootEstimationOnlHos();
    this.fetchLabResultsWithoutInsulin();
    this.fetchPatientsWithICD9AndNoEstimation();
    this.fetchDiabeticPatientsWithCatheterOrders();


  
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
    this.DiabeticFootEstimationOnlHosDataSource .paginator = this.paginatorDiabeticFootEstimationOnlHos;
    this.DiabeticFootEstimationOnlHosDataSource .sort = this.sortDiabeticFootEstimation;
    this.sugerAbove180.paginator = this.paginator1;
    this.sugerAbove180.sort = this.sort1;

    this.InsulinDataSource.paginator = this.Ensoleen;
    this.InsulinDataSource.sort = this.sort3;

    this.DiagnosisICD9dataSource.paginator = this.paginator4;
    this.DiagnosisICD9dataSource.sort = this.sort4;

    this.dataSourceHemoglobin.paginator = this.paginatorHemoglobin;
    this.dataSourceHemoglobin.sort = this.sortHemoglobin;

    this.dataSourceAllConsiliums.paginator = this.paginatorAllConsiliums;
    this.dataSourceAllConsiliums.sort = this.sortAllConsiliums;
    this.dataSourceBelow70.paginator = this.paginatorBelow70;
    this.dataSourceBelow70.sort = this.sortBelow70;
   
    this.DiabeticFootEstimationDataSource.paginator = this.paginatorDiabeticFootEstimation;
    this.DiabeticFootEstimationDataSource.sort = this.sortDiabeticFootEstimation;

    this.LabResultsWithoutInsulinDataSource.paginator = this.paginatorWithoutInsulin;
    this.LabResultsWithoutInsulinDataSource.sort = this.sortWithoutInsulin;
    this.PatientWithICD9AndDontHaveDiabetesEstimationDataSource.paginator = this.paginatorICD9NoEstimation;
this.PatientWithICD9AndDontHaveDiabetesEstimationDataSource.sort = this.sortICD9NoEstimation;
this.DiabeticPatientsWithCatheterOrdersDataSource.paginator = this.paginatorCatheterOrders;
this.DiabeticPatientsWithCatheterOrdersDataSource.sort = this.sortCatheterOrders;
  }

  fetchDiabeticPatientsWithCatheterOrders(): void {
    this.http
      .get<any[]>(`${environment.apiUrl}/DiabetesConsultation/DiabeticPatientsWithCatheterOrders`)
      .subscribe(
        (data) => {
          this.DiabeticPatientsWithCatheterOrdersDataSource.data = data;
          this.originalDiabeticPatientsWithCatheterOrders = data;

          console.log('Fetched Diabetic Patients With Catheter Orders:', data);
        },
        (error) => {
          console.error('Error fetching Diabetic Patients With Catheter Orders:', error);
        }
      );
  }
  fetchPatientsWithICD9AndNoEstimation(): void {
    this.http
      .get<any[]>(`${environment.apiUrl}/DiabetesConsultation/PatientWithICD9AndDontHaveDiabetesEstimation`)
      .subscribe(
        (data) => {
          this.PatientWithICD9AndDontHaveDiabetesEstimationDataSource.data = data;
          this.originalPatientWithICD9AndDontHaveDiabetesEstimation = data;

          console.log('Fetched Patients with ICD9 but no Diabetes Estimation:', data);
        },
        (error) => {
          console.error('Error fetching Patients with ICD9 but no Diabetes Estimation:', error);
        }
      );
  }
  
  // Add the new fetch method
fetchLabResultsWithoutInsulin(): void {
 

  this.http
    .get<any[]>(`${environment.apiUrl}/DiabetesConsultation/LabResultsExcludingInsulinPatients`)
    .subscribe(
      (data) => {
        this.originalLabResultsWithoutInsulin = data;
        this.LabResultsWithoutInsulinDataSource.data = data;
        this.applyGlobalSourceTableFilter();
        this.applyGlobalDateFilter();
      

      },
      (error) => {
        console.error('Error fetching LabResultsWithoutInsulin:', error);
      }
    );
}
// Fetch data from the new endpoint   >> 📊 Result:
// You’ll get current inpatients who:

// Have been hospitalized for more than 24 hours,
// Belong to units not in the excluded list,
// Do not have an active Estimation Grade record of type 263,
// And are not test/dummy patients.
fetchDiabeticFootEstimationOnlHos(): void {
  this.http
    .get<any[]>(`${environment.apiUrl}/DiabetesConsultation/DiabeticFootEstimationOnlHos`)
    .subscribe(
      (data) => {
        this.DiabeticFootEstimationOnlHosDataSource.data = data;
        console.log('Fetched Diabetic Foot Estimation OnlHos Data:', data);
      },
      (error) => {
        console.error('Error fetching Diabetic Foot Estimation OnlHos data:', error);
      }
    );
}

  fetchDiabeticFootEstimation(): void {
    this.http
      .get<any[]>(`${environment.apiUrl}/DiabetesConsultation/DiabeticFootEstimation`)
      .subscribe(
        (data) => {
          this.originalDiabeticFootEstimation = data; // Store original data
          this.DiabeticFootEstimationDataSource.data = data; // Update table data source
          this.applyGlobalSourceTableFilter(); // Apply global filter
          this.applyGlobalDateFilter(); // Apply date filter
          this.updateGaugeValues(); // Update gauges

          console.log('Fetched Diabetic Foot Estimation Data:', data);
        },
        (error) => {
          console.error('Error fetching Diabetic Foot Estimation data:', error);
        }
      );
  }
  

  fetchLabResultsAboveThreshold(): void {
    this.http
      .get<any[]>(`${environment.apiUrl}/DiabetesConsultation/LabResultsAboveThreshold`)
      .subscribe(
        (data) => {
          this.originalSugerAbove180 = data;
          this.sugerAbove180.data = data; // Update table data source
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
        this.originalDataSourceDiagnosisICD9 = data;
        this.DiagnosisICD9dataSource.data = data;
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
    const departments = this.selectedDepartments;
    const { start, end } = this.globalDateFilter;
  
      // ✅ Add debug here:
  console.log('selectedDepartments:', this.selectedDepartments);
  console.log('Example UnitName from data:', this.originalPatientWithICD9AndDontHaveDiabetesEstimation.map(x => x.UnitName));

    const matchesHospitalization = (item: any) =>
      filter === 'All' ||
      (filter === 'CurrentHospitalizations' && item.Release_Date === null) ||
      (filter === 'PastHospitalizations' && item.Release_Date !== null);
  
    const matchesDepartment = (item: any) =>
      departments.length === 0 || departments.includes(item.UnitName);
  
    const matchesDate = (item: any) => {
      const dateField = item.Admission_Date || item.Entry_Date || null;
      if (!dateField) return true; // If no date, include by default
      const recordDate = new Date(dateField);
      if (start && recordDate < start) return false;
      if (end && recordDate > end) return false;
      return true;
    };
  
    // Apply all filters to ALL tables
    this.DiabeticFootEstimationDataSource.data = this.originalDiabeticFootEstimation.filter(item =>
      matchesHospitalization(item) && matchesDepartment(item) && matchesDate(item)
    );
  
    this.DiagnosisICD9dataSource.data = this.originalDataSourceDiagnosisICD9.filter(item =>
      matchesHospitalization(item) && matchesDepartment(item) && matchesDate(item)
    );
  
    this.sugerAbove180.data = this.originalSugerAbove180.filter(item =>
      matchesHospitalization(item) && matchesDepartment(item) && matchesDate(item)
    );
  
    this.InsulinDataSource.data = this.originalDataSource3.filter(item =>
      matchesHospitalization(item) && matchesDepartment(item) && matchesDate(item)
    );
  
    this.LabResultsWithoutInsulinDataSource.data = this.originalLabResultsWithoutInsulin.filter(item =>
      matchesHospitalization(item) && matchesDepartment(item) && matchesDate(item)
    );
  
    this.dataSourceBelow70.data = this.originalDataSourceBelow70.filter(item =>
      matchesHospitalization(item) && matchesDepartment(item) && matchesDate(item)
    );
  
    this.dataSourceHemoglobin.data = this.originalDataSourceHemoglobin.filter(item =>
      matchesHospitalization(item) && matchesDepartment(item) && matchesDate(item)
    );
  
    this.dataSourceAllConsiliums.data = this.originalDataSourceAllConsiliums.filter(item =>
      matchesHospitalization(item) && matchesDepartment(item) && matchesDate(item)
    );
  
    this.PatientWithICD9AndDontHaveDiabetesEstimationDataSource.data =
      this.originalPatientWithICD9AndDontHaveDiabetesEstimation.filter(item =>
        matchesHospitalization(item) && matchesDepartment(item) && matchesDate(item)
      );
  
    this.DiabeticPatientsWithCatheterOrdersDataSource.data =
      this.originalDiabeticPatientsWithCatheterOrders.filter(item =>
        matchesHospitalization(item) && matchesDepartment(item) && matchesDate(item)
      );
  
    this.updateGaugeValues();
  }
  
  
  
  
  
  

  onGlobalSourceTableToggleChange(value: string): void {
    this.globalSourceTableFilter = value;
  
    // switch (value) {
    //   case 'CurrentHospitalizations':
    //     this.sugerAbove180.data = this.originalSugerAbove180.filter(
    //       (item) => item.Release_Date === null
    //     );
    //     break;
  
    //   case 'PastHospitalizations':
    //     this.sugerAbove180.data = this.originalSugerAbove180.filter(
    //       (item) => item.Release_Date !== null
    //     );
    //     break;
  
    //   default:
    //     this.sugerAbove180.data = [...this.originalSugerAbove180];
    //     break;
    // }
  
    // Recalculate percentage after filter change
    this.recalculateLabResultsPercentage();
    this.applyGlobalDateFilter();

  }
  

  

  updateGaugeValues(): void {
    // Calculate Lab Results Percentage
    const labTableLength = this.sugerAbove180.data.length; // Data length for בדיקות מעבדה
    const labDenominator = this.globalSourceTableFilter === 'מאושפזים' ? this.NullReleaseDateCount : this.NonNullReleaseDateCount;
    this.labResultsPercentage = labDenominator > 0 ? (labTableLength / labDenominator) * 100 : 0;
  
    console.log('בדיקות מעבדה:', {
      TableLength: labTableLength,
      Denominator: labDenominator,
      Percentage: this.labResultsPercentage,
    });

     // Calculate Diabetic Foot Estimation Percentage
  this.diabeticFootEstimationPercentage =
  this.DiagnosisICD9dataSource.data.length > 0
    ? (this.DiabeticFootEstimationDataSource.data.length / this.DiagnosisICD9dataSource.data.length) * 100
    : 0;

console.log('Diabetic Foot Estimation Percentage:', this.diabeticFootEstimationPercentage);
  
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
    const icd9TableLength = this.DiagnosisICD9dataSource.data.length; // Data length for מטופלים עם אבחנה
    const icd9Denominator = this.globalSourceTableFilter === 'מאושפזים' ? this.NullReleaseDateCount : this.NonNullReleaseDateCount;
    this.Icd9Percentage = icd9Denominator > 0 ? (icd9TableLength / icd9Denominator) * 100 : 0;
  
    console.log('מטופלים עם אבחנה:', {
      TableLength: icd9TableLength,
      Denominator: icd9Denominator,
      Percentage: this.Icd9Percentage,
    });
  

    // 180suger and all not just icd9
    const sugar180TableLength = this.sugerAbove180.data.length;
const sugar180Denominator = this.globalSourceTableFilter === 'מאושפזים' ? this.NullReleaseDateCount : this.NonNullReleaseDateCount;
this.sugar180AllPercentage = sugar180Denominator > 0 ? (sugar180TableLength/sugar180Denominator) * 100 : 0;

console.log('סוכר 180 מתוך כלל האשפוזים:', {
  TableLength: sugar180TableLength,
  Denominator: sugar180Denominator,
  Percentage: this.sugar180AllPercentage,
});
    // Calculate Sugar 180 and Diabetes Percentage
    this.sugar180DiabetesPercentage =
      this.DiagnosisICD9dataSource.data.length > 0
        ? (this.sugerAbove180.data.length / this.DiagnosisICD9dataSource.data.length) * 100
        : 0;
  
    console.log('סוכר 180 וחולה סוכרת:', {
      Numerator: this.sugerAbove180.data.length,
      Denominator: this.DiagnosisICD9dataSource.data.length,
      Percentage: this.sugar180DiabetesPercentage,
    });
  
    // Calculate Sugar 70 and Diabetes Percentage
    this.sugar70DiabetesPercentage =
      this.dataSourceBelow70.data.length > 0
        ? (this.sugerAbove180.data.length / this.dataSourceBelow70.data.length) * 100
        : 0;
  
    console.log('סוכר 70 וחולה סוכרת:', {
      Numerator: this.sugerAbove180.data.length,
      Denominator: this.dataSourceBelow70.data.length,
      Percentage: this.sugar70DiabetesPercentage,
    });
  
// Calculate Insulin Percentage with sugar180 as denominator
const insulinTableLength = this.InsulinDataSource.data.length; // Data length for מקבל אינסולין
const sugar180TableLengthForInsulin = this.sugerAbove180.data.length; // This becomes the denominator
this.insulinPercentage = sugar180TableLengthForInsulin > 0 ? (insulinTableLength / sugar180TableLengthForInsulin) * 100 : 0;

console.log('מקבל אינסולין (מתוך סוכר מעל 180):', {
  Numerator: insulinTableLength,
  Denominator: sugar180TableLengthForInsulin,
  Percentage: this.insulinPercentage,
});

this.icd9WithoutEstimationPercentage =
  this.DiagnosisICD9dataSource.data.length > 0
    ? (this.PatientWithICD9AndDontHaveDiabetesEstimationDataSource.data.length /
       this.DiagnosisICD9dataSource.data.length) * 100
    : 0;

console.log('ICD9 without Diabetic Estimation %:', this.icd9WithoutEstimationPercentage);

// Add this inside updateGaugeValues()
const withoutInsulinTableLength = this.LabResultsWithoutInsulinDataSource.data.length;
const withoutInsulinDenominator = this.globalSourceTableFilter === 'מאושפזים' ? this.NullReleaseDateCount : this.NonNullReleaseDateCount;

this.labResultsWithoutInsulinPercentage =
  withoutInsulinDenominator > 0 ? (withoutInsulinTableLength / withoutInsulinDenominator) * 100 : 0;

console.log('Lab Results without Insulin %:', {
  TableLength: withoutInsulinTableLength,
  Denominator: withoutInsulinDenominator,
  Percentage: this.labResultsWithoutInsulinPercentage,
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

  this.DiabeticFootEstimationDataSource.data = this.originalDiabeticFootEstimation.filter((item) =>
  isWithinDateRange(item.Admission_Date)
);

console.log('Filtered DiabeticFootEstimationDataSource after date filter:', this.DiabeticFootEstimationDataSource.data);
    this.sugerAbove180.data = this.originalSugerAbove180.filter((item) =>
      isWithinDateRange(item.Admission_Date)
    );
  
    this.InsulinDataSource.data = this.originalDataSource3.filter((item) =>
      isWithinDateRange(item.Admission_Date)
    );
  
    this.DiagnosisICD9dataSource.data = this.originalDataSourceDiagnosisICD9.filter((item) =>
      isWithinDateRange(item.Admission_Date)
    );
  
    console.log('Filtered InsulinDataSource after date filter:', this.InsulinDataSource.data);
  
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

    this.LabResultsWithoutInsulinDataSource.data = this.originalLabResultsWithoutInsulin.filter(
      (item) => isWithinDateRange(item.Admission_Date)
    );
    this.PatientWithICD9AndDontHaveDiabetesEstimationDataSource.data = 
  this.PatientWithICD9AndDontHaveDiabetesEstimationDataSource.data.filter((item) =>
    isWithinDateRange(item.Admission_Date)
);

this.DiabeticPatientsWithCatheterOrdersDataSource.data = 
  this.DiabeticPatientsWithCatheterOrdersDataSource.data.filter((item) =>
    isWithinDateRange(item.Admission_Date)
);
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
      const filteredCount = this.sugerAbove180.data.length;
    
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
      const filteredData = this.originalSugerAbove180.filter((item) =>
        this.isWithinDateRange(item.Admission_Date)
      );
    
      const filteredBelow70 = this.originalDataSourceBelow70.filter((item) =>
        this.isWithinDateRange(item.Admission_Date)
      );
    
      const filteredICD9 = this.originalDataSourceDiagnosisICD9.filter((item) =>
        this.isWithinDateRange(item.Admission_Date)
      );
    
      const filteredInsulin = this.originalDataSource3.filter((item) =>
        this.isWithinDateRange(item.Admission_Date)
      );

      const filteredDiabeticFootEstimation = this.originalDiabeticFootEstimation.filter((item) =>
      this.isWithinDateRange(item.Admission_Date)
    );
    const filteredWithoutInsulin = this.originalLabResultsWithoutInsulin.filter((item) =>
  this.isWithinDateRange(item.Admission_Date)
);
const filteredICD9NoEstimation = this.originalPatientWithICD9AndDontHaveDiabetesEstimation.filter((item) =>
  this.isWithinDateRange(item.Admission_Date)
);
const filteredCatheterOrders = this.originalDiabeticPatientsWithCatheterOrders.filter((item) =>
  this.isWithinDateRange(item.Admission_Date)
);
    
      if (this.globalSourceTableFilter === 'מאושפזים') {
        // Filter for "מאושפזים" (current hospitalizations)
        this.sugerAbove180.data = filteredData.filter((item) => item.Release_Date === null);
        this.dataSourceBelow70.data = filteredBelow70.filter((item) => item.Release_Date === null);
        this.DiagnosisICD9dataSource.data = filteredICD9.filter((item) => item.Release_Date === null);
        this.InsulinDataSource.data = filteredInsulin.filter((item) => item.Release_Date === null);
        this.DiabeticFootEstimationDataSource.data = filteredDiabeticFootEstimation.filter(
          (item) => item.Release_Date === null);
      } else {
        // Filter for "All"
        this.sugerAbove180.data = filteredData;
        this.dataSourceBelow70.data = filteredBelow70;
        this.DiagnosisICD9dataSource.data = filteredICD9;
        this.InsulinDataSource.data = filteredInsulin;
        this.DiabeticFootEstimationDataSource.data = filteredDiabeticFootEstimation;

      }
      if (this.globalSourceTableFilter === 'מאושפזים') {
        this.LabResultsWithoutInsulinDataSource.data = filteredWithoutInsulin.filter((item) => item.Release_Date === null);
      } else {
        this.LabResultsWithoutInsulinDataSource.data = filteredWithoutInsulin;
      }

      if (this.globalSourceTableFilter === 'מאושפזים') {
        // Existing filtering...
        this.PatientWithICD9AndDontHaveDiabetesEstimationDataSource.data = filteredICD9NoEstimation.filter((item) => item.Release_Date === null);
        this.DiabeticPatientsWithCatheterOrdersDataSource.data = filteredCatheterOrders.filter((item) => item.Release_Date === null);
      } else {
        this.PatientWithICD9AndDontHaveDiabetesEstimationDataSource.data = filteredICD9NoEstimation;
        this.DiabeticPatientsWithCatheterOrdersDataSource.data = filteredCatheterOrders;
      }
      // Update gauge values
      this.updateGaugeValues();
    
      
    }
    
    
    
    updateHospitalizationCounts(): void {
      this.CurrentHospitalizations = this.sugerAbove180.data.filter((item) => item.Release_Date === null).length;
      this.TotalHospitalizations = this.originalSugerAbove180.length;
    
      console.log('Updated Current Hospitalizations:', this.CurrentHospitalizations);
      console.log('Updated Total Hospitalizations:', this.TotalHospitalizations);
    }
    
    // Update the selected source filter when a toggle is clicked
    onSourceFilterChange(filter: string): void {
      this.tempGlobalSourceTableFilter = filter;
    }
    resetFilters(): void {
    
      // Reset date range
      this.globalDateFilter = { start: null, end: null };
    
      // Reset toggle filter
      this.globalSourceTableFilter = 'All';
      this.tempGlobalSourceTableFilter = 'All';
    
      // Fetch initial hospitalization counts (without any filters)
      this.fetchHosCount(null, null);
    
      // Reset data sources to their original values
      this.sugerAbove180.data = [...this.originalSugerAbove180];
      this.InsulinDataSource.data = [...this.originalDataSource3];
      this.DiagnosisICD9dataSource.data = [...this.originalDataSourceDiagnosisICD9];
      this.dataSourceHemoglobin.data = [...this.originalDataSourceHemoglobin];
      this.dataSourceAllConsiliums.data = [...this.originalDataSourceAllConsiliums];
      this.dataSourceBelow70.data = [...this.originalDataSourceBelow70];
      this.LabResultsWithoutInsulinDataSource.data = [...this.originalLabResultsWithoutInsulin];
      this.PatientWithICD9AndDontHaveDiabetesEstimationDataSource.data = [...this.originalPatientWithICD9AndDontHaveDiabetesEstimation];
      this.DiabeticPatientsWithCatheterOrdersDataSource.data = [...this.originalDiabeticPatientsWithCatheterOrders];
      
    
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
      return this.sugerAbove180.filteredData.length;
    }
    
  
    openDialog(row: any): void {
      const data = {
        Patient: row.Hospitalization_Patient || row.Patient,
        AdmissionDate: row.Admission_Date
      };
    
      this.dialog.open(LabResultsDetailDialogComponent, {
        width: '1200px',
        data: data
      });
    }
    
    
    
    
    
     
    
}
