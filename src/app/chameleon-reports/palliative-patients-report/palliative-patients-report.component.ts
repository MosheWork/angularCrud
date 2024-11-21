import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { environment } from '../../../environments/environment';
import * as XLSX from 'xlsx';

interface PalliativePatientsReportModel {
  FirstName: string;
  LastName: string;
  IdNum: string;
  AdmissionNo: string;
 // MedicalRecord: string;
 // EntryDate: Date | null;
  ResultComboText: string;
  SystemUnitName: string;
  AdmissionDate: Date | null;
  HospitalizationStatus: string;
  DiagnosisFound: string;
  //DescriptionMatchFound: string;
  PatientDied: string;
  RecordCount: number; // New column

}

@Component({
  selector: 'app-palliative-patients-report',
  templateUrl: './palliative-patients-report.component.html',
  styleUrls: ['./palliative-patients-report.component.scss'],
  providers: [DatePipe]
})
export class PalliativePatientsReportComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'FirstName',
    'LastName',
    'IdNum',
    'AdmissionNo',
    //'MedicalRecord',
    //'EntryDate',
    'ResultComboText',
    'SystemUnitName',
    'AdmissionDate',
    'HospitalizationStatus',
    'DiagnosisFound',
    //'DescriptionMatchFound',
    'PatientDied',
    'RecordCount' // New column

  ];
  columnHeaders: { [key: string]: string } = {
    FirstName: 'שם פרטי',
    LastName: 'שם משפחה',
    IdNum: 'תעודת זהות',
    AdmissionNo: 'מספר מקרה',
    //MedicalRecord: '',
    ResultComboText: 'מצב החולה',
    SystemUnitName: 'מחלקה',
    AdmissionDate: 'תאריך קבלה',
    HospitalizationStatus: 'סטטוס אשפוז',
    DiagnosisFound: 'אבחנה נמצאה',
    PatientDied: 'מטופל נפטר',
    RecordCount: 'כמות אשפוזים בחצי שנה אחרונה ' // New column

  };

  dataSource = new MatTableDataSource<PalliativePatientsReportModel>();
  totalResults: number = 0;
  filterForm: FormGroup;
  loading: boolean = false;
  globalFilter: string = '';
  hospitalizationStatusOptions: string[] = ['','Not Found', 'עדיין מאושפז', 'Released'];
  yesNoOptions: string[] = ['','Yes', 'No'];
  recordCountOptions: { value: string, label: string }[] = [
    { value: '', label: 'כל הערכים' }, // All values
    { value: '>=3', label: '3 או יותר' } // 3 or more
  ];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private fb: FormBuilder, private datePipe: DatePipe) {
    this.filterForm = this.createFilterForm();
  }

  ngOnInit(): void {
    console.log('Component initialized'); // This should appear in the console
    this.dataSource.filterPredicate = this.createFilterPredicate();
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  
  onFilterChange(controlName: string, selectedValue: string | null): void {
    const value = selectedValue?.trim() || ''; // Fallback to an empty string if null
    console.log(`Filter '${controlName}' changed to:`, value);
    console.log('Current filter form values:', this.filterForm.value);
    this.applyFilters();
  }
  
  
  loadData(): void {
    this.loading = true;
    const filters = this.filterForm.value;
    let params = new HttpParams();
  
    // Add form controls as query params
    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        params = params.append(key, filters[key]);
      }
    });
  
    this.http
      .get<PalliativePatientsReportModel[]>(`${environment.apiUrl}PalliativePatientsReport`, { params })
      .subscribe(
        (data) => {
          console.log('Data received from API:', data);
          console.log('Filter options:', {
            hospitalizationStatusOptions: this.hospitalizationStatusOptions,
            yesNoOptions: this.yesNoOptions,
          });
          this.dataSource.data = data;
          this.totalResults = data.length;
          this.loading = false;
          this.applyFilters(); // Apply filters after loading data
        },
        (error) => {
          console.error('Error fetching data:', error);
          this.loading = false;
        }
      );
  }
  

  applyGlobalFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.globalFilter = filterValue;
    this.applyFilters();
    
  }

  applyFilters(): void {
    const filters = this.filterForm.value; // Get the current form values
    const globalFilterValue = this.globalFilter.trim().toLowerCase();
  
    // Combine all filters into a single serialized string
    const combinedFilters = {
      globalFilter: globalFilterValue,
      ...filters,
    };
  
    this.dataSource.filterPredicate = (data: PalliativePatientsReportModel, filter: string): boolean => {
      const searchTerms = JSON.parse(filter);
  
      // Global filter logic
      const matchesGlobalFilter = searchTerms.globalFilter
        ? Object.values(data)
            .filter((value) => value !== null && value !== undefined)
            .join(' ')
            .toLowerCase()
            .includes(searchTerms.globalFilter)
        : true;
  
      // Specific field filters logic
      const matchesHospitalizationStatus = searchTerms.HospitalizationStatus
        ? data.HospitalizationStatus === searchTerms.HospitalizationStatus
        : true;
  
      const matchesDiagnosisFound = searchTerms.DiagnosisFound
        ? data.DiagnosisFound === searchTerms.DiagnosisFound
        : true;
  
      const matchesPatientDied = searchTerms.PatientDied
        ? data.PatientDied === searchTerms.PatientDied
        : true;
  
      // RecordCount filter logic
      const matchesRecordCount =
        searchTerms.RecordCount === '>=3'
          ? data.RecordCount >= 3 // Only allow records with RecordCount >= 3
          : true; // If "All" is selected, show all rows
  
      // Combine all filters
      return (
        matchesGlobalFilter &&
        matchesHospitalizationStatus &&
        matchesDiagnosisFound &&
        matchesPatientDied &&
        matchesRecordCount
      );
    };
  
    // Apply the combined filter
    this.dataSource.filter = JSON.stringify(combinedFilters);
  
    // Update totalResults after filtering
    this.totalResults = this.dataSource.filteredData.length;
  }
  
  
  
  
  
  
  
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.globalFilter = filterValue;
    this.applyFilters();
  }
  
  
  

  createFilterPredicate(): (data: PalliativePatientsReportModel, filter: string) => boolean {
    return (data: PalliativePatientsReportModel, filter: string): boolean => {
      const searchTerms = JSON.parse(filter);
  
      const matchesGlobalFilter = this.globalFilter
        ? Object.values(data)
            .join(' ')
            .toLowerCase()
            .includes(this.globalFilter.toLowerCase())
        : true;
  
      const matchesHospitalizationStatus = searchTerms.HospitalizationStatus
        ? data.HospitalizationStatus === searchTerms.HospitalizationStatus
        : true;
  
      const matchesDiagnosisFound = searchTerms.DiagnosisFound
        ? data.DiagnosisFound === searchTerms.DiagnosisFound
        : true;
  
      const matchesPatientDied = searchTerms.PatientDied
        ? data.PatientDied === searchTerms.PatientDied
        : true;
  
      return matchesGlobalFilter && matchesHospitalizationStatus && matchesDiagnosisFound && matchesPatientDied;
    };
  }
  

  createFilterForm(): FormGroup {
    return this.fb.group({
      FirstName: new FormControl(''),
      LastName: new FormControl(''),
      IdNum: new FormControl(''),
      AdmissionNo: new FormControl(''),
      //EntryDate: new FormControl(''),
      AdmissionDate: new FormControl(''),
      HospitalizationStatus: new FormControl('עדיין מאושפז'),
      DiagnosisFound: new FormControl(''),
      PatientDied: new FormControl(''),
      RecordCount: new FormControl('') // New filter
    });
  }
  
  

  resetFilters(): void {
    this.filterForm.reset(); // Reset the form
    this.globalFilter = ''; // Clear the global filter
    this.applyFilters(); // Reapply filters
    this.loadData(); // Optionally reload the data from the server
  }

  exportToExcel(): void {
    const data = this.dataSource.data.map((item) => {
      const record: any = {};
      this.displayedColumns.forEach((column) => (record[column] = item[column as keyof PalliativePatientsReportModel]));
      return record;
    });
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = {
      Sheets: { data: worksheet },
      SheetNames: ['data']
    };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'PalliativePatientsReport.xlsx';
    link.click();
  }
}
