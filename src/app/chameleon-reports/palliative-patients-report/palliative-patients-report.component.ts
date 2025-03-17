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
  PatientName: string;
  IdNum: string;
  AdmissionNo: string;
  ResultComboText: string;
  ComboEntryDate: Date | null;
  AdmissionDate: Date | null;
}

@Component({
  selector: 'app-palliative-patients-report',
  templateUrl: './palliative-patients-report.component.html',
  styleUrls: ['./palliative-patients-report.component.scss'],
  providers: [DatePipe]
})
export class PalliativePatientsReportComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'PatientName',
    'name',
    'IdNum',
    'AdmissionNo',
    'AdmissionDate',
    'ResultCognitive',
    'ResultEntryDate',
    //'DescriptionCognitive',
    //'DescriptionEntryDate'
  ];

  columnHeaders: { [key: string]: string } = {
    PatientName: 'שם המטופל',
    name: 'מחלקה',
    IdNum: 'תעודת זהות',
    AdmissionNo: 'מספר מקרה',
    AdmissionDate: 'תאריך קבלה',
    ResultCognitive:'הגדרת החולה',
    ResultEntryDate:'תאריך הגדרה',
    //DescriptionCognitive:'תיעוד רופא מלל חופשי',
    //DescriptionEntryDate:' תאריך התיעוד',
  };

  dataSource = new MatTableDataSource<PalliativePatientsReportModel>();
  totalResults: number = 0;
  filterForm: FormGroup;
  loading: boolean = false;
  globalFilter: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private fb: FormBuilder, private datePipe: DatePipe) {
    this.filterForm = this.createFilterForm();
  }

  ngOnInit(): void {
    console.log('Component initialized');
    this.dataSource.filterPredicate = this.createFilterPredicate();
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadData(): void {
    this.loading = true;
    const filters = this.filterForm.value;
    let params = new HttpParams();

    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        params = params.append(key, filters[key]);
      }
    });

    this.http
      .get<PalliativePatientsReportModel[]>(`${environment.apiUrl}PalliativePatientsReport`, { params })
      .subscribe(
        (data) => {
          console.log('Data received:', data);
          this.dataSource.data = data;
          this.totalResults = data.length;
          this.loading = false;
          this.applyFilters();
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
    const filters = this.filterForm.value;
    const globalFilterValue = this.globalFilter.trim().toLowerCase();

    const combinedFilters = {
      globalFilter: globalFilterValue,
      ...filters
    };

    this.dataSource.filter = JSON.stringify(combinedFilters);
    this.totalResults = this.dataSource.filteredData.length;
  }

  createFilterPredicate(): (data: PalliativePatientsReportModel, filter: string) => boolean {
    return (data: PalliativePatientsReportModel, filter: string): boolean => {
      const searchTerms = JSON.parse(filter);
      const matchesGlobalFilter = searchTerms.globalFilter
        ? Object.values(data)
            .filter((value) => value !== null && value !== undefined)
            .join(' ')
            .toLowerCase()
            .includes(searchTerms.globalFilter)
        : true;

      return matchesGlobalFilter;
    };
  }

  createFilterForm(): FormGroup {
    return this.fb.group({
      PatientName: new FormControl(''),
      IdNum: new FormControl(''),
      AdmissionNo: new FormControl(''),
      ResultComboText: new FormControl(''),
      ComboEntryDate: new FormControl(''),
      AdmissionDate: new FormControl('')
    });
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.globalFilter = '';
    this.applyFilters();
    this.loadData();
  }

  exportToExcel(): void {
    const data = this.dataSource.data.map((item) => {
      return {
        'שם המטופל': item.PatientName,
        'תעודת זהות': item.IdNum,
        'מספר מקרה': item.AdmissionNo,
        'מצב החולה': item.ResultComboText,
        'תאריך כניסת האבחנה': this.datePipe.transform(item.ComboEntryDate, 'yyyy-MM-dd'),
        'תאריך קבלה': this.datePipe.transform(item.AdmissionDate, 'yyyy-MM-dd')
      };
    });

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
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
