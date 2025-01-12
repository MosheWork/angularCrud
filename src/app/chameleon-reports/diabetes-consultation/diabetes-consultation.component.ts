import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { FormGroup, FormControl } from '@angular/forms';
import * as XLSX from 'xlsx';
import { environment } from '../../../environments/environment';
import { Renderer2 } from '@angular/core';

@Component({
  selector: 'app-diabetes-consultation',
  templateUrl: './diabetes-consultation.component.html',
  styleUrls: ['./diabetes-consultation.component.scss'],
})
export class DiabetesConsultationComponent implements OnInit {
  // Properties for the data
  filteredData: any[] = [];
  isDarkMode = false;

  totalHos: number = 0;
  totalHosWithIcd9: number = 0;
  Icd9Percentage: number = 0;
  TotalHosLabResultover180: number = 0;
  labResultOver180Percentage: number = 0;
  TotalHosInsulin: number = 0;
  insulinPercentage: number = 0;
  HemoglobinAbove8Count: number = 0;
  HemoglobinAbove8Percentage: number = 0;
  Title1: string = ' סה"כ מטופלים- ';
  Title2: string = 'מאושפים:';
  titleUnit: string = 'דאשבורד סכרת';
  totalResults: number = 0;

  displayedColumns: string[] = [
    'Admission_No',
    'Admission_Date',
    //'Release_Date',
    'First_Name',
    'Last_Name',
    'Count_Above_180_Less_8h',
  ];
  displayedColumns3: string[] = [
    //'Hospitalization_Patient',
    'Admission_No',
    'Admission_Date',
    'Id_Num',
    'First_Name',
    'Last_Name',
    //'Main_Drug',
    'Name',
    'Entry_Date',
  ];
  displayedColumns4: string[] = [
    'Hospitalization_Patient',
    'Admission_No',
    'Admission_Date',
    'Id_Num',
    'First_Name',
    'Last_Name',
    'ICD9',
    'Name',
    'Entry_Date',
  ];

  dataSourceHemoglobin = new MatTableDataSource<any>();
  displayedColumnsHemoglobin: string[] = [
      'Admission_Date',
      'TestCode',
      'TestName',
      'Result',
      'TestDate',
      'Id_Num',
      'First_Name',
      'Last_Name'
  ];
  displayedColumns2: string[] = ['SomeColumn']; // Columns for the second table
  dataSourceAllConsiliums = new MatTableDataSource<any>();
  dataSourceConsiliumCounts: any = {}; // Holds the counts data
  
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


  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>();

  dataSource1 = new MatTableDataSource<any>();
  dataSource2 = new MatTableDataSource<any>();
  dataSource3 = new MatTableDataSource<any>();
  dataSource4 = new MatTableDataSource<any>();

  // Form for global filter
  filterForm: FormGroup = new FormGroup({
    globalFilter: new FormControl(''),
  });

  @ViewChild(MatPaginator) paginator1!: MatPaginator;
  @ViewChild(MatPaginator) paginator2!: MatPaginator;

  @ViewChild(MatSort) sort1!: MatSort;
  @ViewChild(MatSort) sort2!: MatSort;
  @ViewChild('sort3', { static: true }) sort3!: MatSort;
  @ViewChild('paginator3', { static: true }) paginator3!: MatPaginator;
  @ViewChild('paginatorAllConsiliums') paginatorAllConsiliums!: MatPaginator;
  @ViewChild('sortAllConsiliums') sortAllConsiliums!: MatSort;
  
  @ViewChild('paginator4') paginator4!: MatPaginator;
  @ViewChild('sort4') sort4!: MatSort;

  @ViewChild('paginatorHemoglobin') paginatorHemoglobin!: MatPaginator;
  @ViewChild('sortHemoglobin') sortHemoglobin!: MatSort;
  constructor(private http: HttpClient, private renderer: Renderer2) {}

  ngOnInit(): void {
    this.fetchData();
    this.fetchTable1Data();
    this.fetchInsulinData(); // Fetch insulin data
    this.fetchDiagnosisData(); // Fetch diagnosis data
    this.fetchHemoglobinAbove8(); // Fetch hemoglobin data
    this.fetchAllConsiliums(); // Fetch all consiliums
    this.fetchConsiliumCounts(); // Fetch consilium counts

    this.dataSource1.paginator = this.paginator1;
    this.dataSource1.sort = this.sort1;
  
    this.dataSource3.paginator = this.paginator3;
    this.dataSource3.sort = this.sort3;
  
    this.dataSource4.paginator = this.paginator4;
    this.dataSource4.sort = this.sort4;
  
    this.dataSourceHemoglobin.paginator = this.paginatorHemoglobin;
    this.dataSourceHemoglobin.sort = this.sortHemoglobin;
  
    this.dataSourceAllConsiliums.paginator = this.paginator1; // Adjust if using a separate paginator
    this.dataSourceAllConsiliums.sort = this.sort1; // Adjust if using a separate sort
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    this.isDarkMode = savedDarkMode;

    // Apply the class if dark mode is enabled
    if (this.isDarkMode) {
      document.body.classList.add('dark-mode');
    }
    // Apply filter when global filter changes
    this.filterForm
      .get('globalFilter')
      ?.valueChanges.subscribe((filterValue) => {
        this.applyFilter(filterValue);
      });
  }

  // Fetch data from the API
  fetchData(): void {
    this.http.get<any>(`${environment.apiUrl}/DiabetesConsultation`).subscribe(
      (data) => {
        this.totalResults = data.TotalHos;
        this.totalHosWithIcd9 = data.TotalHosWithIcd9;
        this.Icd9Percentage = data.Icd9Percentage;
        this.TotalHosLabResultover180 = data.TotalHosLabResultover180;
        this.labResultOver180Percentage = data.LabResultover180Percentage;
        this.TotalHosInsulin = data.TotalHosInsulin;
        this.insulinPercentage = data.InsulinPercentage;
        this.HemoglobinAbove8Count = data.HemoglobinAbove8Count;
        this.HemoglobinAbove8Percentage = data.HemoglobinAbove8Percentage;
      },
      (error) => {
        console.error('Error fetching data:', error);
      }
    );
  }

  fetchTable1Data(): void {
    this.http
      .get<any[]>(
        `${environment.apiUrl}DiabetesConsultation/LabResultsAboveThreshold`
      )
      .subscribe(
        (data) => {
          this.dataSource1 = new MatTableDataSource(data);
          this.dataSource1.paginator = this.paginator1;
          this.dataSource1.sort = this.sort1;
        },
        (error) => {
          console.error('Error fetching Table 1 data:', error);
        }
      );
  }


  // Apply filter to table data
  applyFilter(filterValue: string): void {
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  exportToExcel() {
    const excelData = this.convertToExcelFormat(this.filteredData);

    const blob = new Blob([excelData], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'filtered_data.xlsx';
    link.click();
  }

  convertToExcelFormat(data: any[]) {
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
  fetchInsulinData(): void {
    this.http
      .get<any[]>(`${environment.apiUrl}/DiabetesConsultation/insulin`)
      .subscribe(
        (data) => {
          this.dataSource3 = new MatTableDataSource(data);
          this.dataSource3.paginator = this.paginator3;
          this.dataSource3.sort = this.sort3;
         
        },
        (error) => {
          console.error('Error fetching insulin data:', error);
        }
      );
  }
  fetchDiagnosisData(): void {
    this.http.get<any[]>(`${environment.apiUrl}/DiabetesConsultation/diagnosis`).subscribe(
      (data) => {
        this.dataSource4 = new MatTableDataSource(data);
        this.dataSource4.paginator = this.paginator4; // Correct paginator
        this.dataSource4.sort = this.sort4; // Correct sort
      },
      (error) => {
        console.error('Error fetching Diagnosis data:', error);
      }
    );
  }
  fetchHemoglobinAbove8(): void {
    this.http.get<any[]>(`${environment.apiUrl}/DiabetesConsultation/HemoglobinAbove8`).subscribe(
      (data) => {
        this.dataSourceHemoglobin = new MatTableDataSource(data);
        this.dataSourceHemoglobin.paginator = this.paginatorHemoglobin;
        this.dataSourceHemoglobin.sort = this.sortHemoglobin;
      },
      (error) => {
        console.error('Error fetching Hemoglobin Above 8 data:', error);
      }
    );
  }
  fetchAllConsiliums(): void {
    this.http.get<any[]>(`${environment.apiUrl}/DiabetesConsultation/AllConsiliums`).subscribe(
      (data) => {
        this.dataSourceAllConsiliums = new MatTableDataSource(data);
        // Assign paginator and sort explicitly here
        this.dataSourceAllConsiliums.paginator = this.paginatorAllConsiliums;
        this.dataSourceAllConsiliums.sort = this.sortAllConsiliums;
      },
      (error) => {
        console.error('Error fetching All Consiliums data:', error);
      }
    );
  }
  fetchConsiliumCounts(): void {
    this.http
      .get<any>(`${environment.apiUrl}/DiabetesConsultation/ConsiliumCounts`)
      .subscribe(
        (data) => {
          this.dataSourceConsiliumCounts = data;
        },
        (error) => {
          console.error('Error fetching Consilium Counts:', error);
        }
      );
  }
  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;

    if (this.isDarkMode) {
      document.body.classList.add('dark-mode');
      console.log('Dark mode enabled');
    } else {
      document.body.classList.remove('dark-mode');
      console.log('Dark mode disabled');
    }

    // Save to localStorage
    localStorage.setItem('darkMode', this.isDarkMode.toString());
  }
 
  
}
