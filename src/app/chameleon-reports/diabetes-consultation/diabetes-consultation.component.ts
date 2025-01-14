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
  Title1: string = ' סה"כ מטופלים- ';
  Title2: string = 'מאושפים:';
  titleUnit: string = 'דאשבורד סכרת';
  totalResults: number = 0;

  displayedColumns: string[] = [
    'Admission_No',
    'Admission_Date',
    'First_Name',
    'Last_Name',
    'Count_Above_180_Less_8h',
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
    //'Patient',
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

  dataSource1 = new MatTableDataSource<any>();
  dataSource3 = new MatTableDataSource<any>();
  dataSource4 = new MatTableDataSource<any>();
  dataSourceHemoglobin = new MatTableDataSource<any>();
  dataSourceAllConsiliums = new MatTableDataSource<any>();

  filterForm: FormGroup = new FormGroup({
    globalFilter: new FormControl(''),
  });

  @ViewChild('paginator1') paginator1!: MatPaginator;
  @ViewChild('Ensoleen') Ensoleen!: MatPaginator;
  @ViewChild('paginator4') paginator4!: MatPaginator;
  @ViewChild('paginatorHemoglobin') paginatorHemoglobin!: MatPaginator;
  @ViewChild('paginatorAllConsiliums') paginatorAllConsiliums!: MatPaginator;

  @ViewChild('sort1') sort1!: MatSort;
  @ViewChild('sort3') sort3!: MatSort;
  @ViewChild('sort4') sort4!: MatSort;
  @ViewChild('sortHemoglobin') sortHemoglobin!: MatSort;
  @ViewChild('sortAllConsiliums') sortAllConsiliums!: MatSort;

  constructor(private http: HttpClient, private renderer: Renderer2) {}

  ngOnInit(): void {
    this.fetchData();
    this.fetchTable1Data();
    this.fetchInsulinData();
    this.fetchDiagnosisData();
    this.fetchHemoglobinAbove8();
    this.fetchAllConsiliums();

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
    //this.dataSource1.sort = this.sort1;

    this.dataSource3.paginator = this.Ensoleen;
    //this.dataSource3.sort = this.sort3;

    this.dataSource4.paginator = this.paginator4;
    //this.dataSource4.sort = this.sort4;

    this.dataSourceHemoglobin.paginator = this.paginatorHemoglobin;
    // this.dataSourceHemoglobin.sort = this.sortHemoglobin;

    this.dataSourceAllConsiliums.paginator = this.paginatorAllConsiliums;
    //this.dataSourceAllConsiliums.sort = this.sortAllConsiliums;
  }

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
          this.dataSource1.data = data;
        },
        (error) => {
          console.error('Error fetching Table 1 data:', error);
        }
      );
  }
  onTabChanged(event: MatTabChangeEvent) {
    switch (event.index) {
      case 1:
        //this.fetchInsulinData();
        break;
    }
  }
  fetchInsulinData(): void {
    this.http
      .get<any[]>(`${environment.apiUrl}/DiabetesConsultation/insulin`)
      .subscribe(
        (data) => {
          console.log('Insulin Data:', data); // Debug backend response
          // debugger;
          this.EnsoleenresultsLength = data.length;
          this.dataSource3.data = data; // Assign data
          debugger;
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
          console.log('Diagnosis Data:', data); // Debug backend response
          this.dataSource4.data = data; // Assign data
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
          this.dataSourceHemoglobin.data = data;
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
          this.dataSourceAllConsiliums.data = data;
        },
        (error) => {
          console.error('Error fetching All Consiliums data:', error);
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
}
