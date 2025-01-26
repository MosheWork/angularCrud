import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { environment } from '../../../environments/environment';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-erinfo',
  templateUrl: './erinfo.component.html',
  styleUrls: ['./erinfo.component.scss']
})
export class ERInfoComponent implements OnInit {
  displayedColumns: string[] = [
    'AdmissionNo',
    'IdNum',
    'SignaturesInSheetEntryDate',
    'ComplaintTabEntryDate',
    'DischargeDateTabEntryDate',
    'AdmissionTreatmentDecisionTabEntryDate',
    'AdmissionTreatmentUrgencyEntryDate',
    'DecisionDescription',
    'SystemUnitName',
    'EntryUserFullName',
    'AdjustedAdmissionNo',
    'ReleaseDate',
    'ArrivalDate'
  ];

  columnHeaders: { [key: string]: string } = {
    AdmissionNo: 'מספר קבלה',
    IdNum: 'תעודת זהות',
    SignaturesInSheetEntryDate: 'חתימות על גיליון - תאריך',
    ComplaintTabEntryDate: 'תאריך תלונה',
    DischargeDateTabEntryDate: 'תאריך שחרור',
    AdmissionTreatmentDecisionTabEntryDate: 'תאריך החלטה לטיפול',
    AdmissionTreatmentUrgencyEntryDate: 'תאריך דחיפות טיפול',
    DecisionDescription: 'תיאור החלטה',
    SystemUnitName: 'שם יחידה',
    EntryUserFullName: 'שם משתמש מלא',
    AdjustedAdmissionNo: 'מספר קבלה מותאם',
    ReleaseDate: 'תאריך שחרור',
    ArrivalDate: 'תאריך הגעה'
  };

  dataSource = new MatTableDataSource<any>([]);
  globalFilter = new FormControl('');
  filterForm: FormGroup;
  isLoading: boolean = true;
  totalResults: number = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      SignaturesInSheetEntryDate: new FormControl(''),
      ComplaintTabEntryDate: new FormControl(''),
      DischargeDateTabEntryDate: new FormControl(''),
      AdmissionTreatmentDecisionTabEntryDate: new FormControl(''),
      AdmissionTreatmentUrgencyEntryDate: new FormControl(''),
      DecisionDescription: new FormControl('')
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.setupGlobalFilter();
    this.filterForm.valueChanges.subscribe(() => this.applyFilters());
  }

  loadData(): void {
    this.isLoading = true;
    const url = `${environment.apiUrl}ERInfo/ConsolidatedData`;

    this.http.get<any[]>(url).subscribe(
      (response: any[]) => {
        this.dataSource.data = response;
        this.totalResults = response.length;
        this.isLoading = false;
      },
      (error) => {
        console.error('Error loading data:', error);
        this.isLoading = false;
      }
    );
  }

  setupGlobalFilter(): void {
    this.globalFilter.valueChanges.subscribe((filterValue) => {
      const safeFilterValue = filterValue?.trim().toLowerCase() || '';
      this.dataSource.filter = safeFilterValue;
    });

    this.dataSource.filterPredicate = (data, filter: string) => {
      const dataStr = Object.values(data)
        .map((value) => (value ? value.toString().toLowerCase() : ''))
        .join(' ');
      return dataStr.includes(filter);
    };
  }

  applyFilters(): void {
    const filters = this.filterForm.value;

    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const matchesDateFilter = (field: string) => {
        if (!filters[field]) return true;
        const filterDate = new Date(filters[field]);
        const dataDate = new Date(data[field]);
        return filterDate.getTime() === dataDate.getTime();
      };

      const matchesTextFilter = (field: string) => {
        if (!filters[field]) return true;
        return data[field]?.toLowerCase().includes(filters[field].toLowerCase());
      };

      return (
        matchesDateFilter('SignaturesInSheetEntryDate') &&
        matchesDateFilter('ComplaintTabEntryDate') &&
        matchesDateFilter('DischargeDateTabEntryDate') &&
        matchesDateFilter('AdmissionTreatmentDecisionTabEntryDate') &&
        matchesDateFilter('AdmissionTreatmentUrgencyEntryDate') &&
        matchesTextFilter('DecisionDescription')
      );
    };

    this.dataSource.filter = 'apply';
    this.totalResults = this.dataSource.filteredData.length;
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.globalFilter.setValue('');
    this.applyFilters();
  }

  exportToExcel(): void {
    const data = this.dataSource.filteredData.map((item) => {
      return this.displayedColumns.reduce((acc, column) => {
        acc[column] = item[column];
        return acc;
      }, {} as any);
    });

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'ERInfoData.xlsx';
    anchor.click();
    window.URL.revokeObjectURL(url);
  }
}
