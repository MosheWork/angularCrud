import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { environment } from '../../../environments/environment';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-erinfo',
  templateUrl: './erinfo.component.html',
  styleUrls: ['./erinfo.component.scss'],
})
export class ERInfoComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'arrivalDate',
    'admissionNo',
    'idNum',
    'systemUnitName',
    'responsibleDoctor', // סוג מיון
    'admissionTreatmentUrgencyEntryDate',
    'admissionTreatmentUrgencyEntryUser',
    'urgencyLevel',
    'firstExecutionDate',
    'lastExecutionDate',
    'admissionTreatmentDecisionTabEntryDate',
    'admissionTreatmentDecisionTabEntryUser',
    'complaintTabEntryDate',
    'fieldCombo18Translated',
    'complaintTabEntryUser',
    'decisionDescription',
    'dischargeDateTabEntryDate',
    'dischargeDateTabEntryUser',
    'signaturesInSheetEntryDate',
    'signaturesInSheetEntryUser',
    // 'entryUserFullName',
    // 'adjustedAdmissionNo',
    'releaseDate',
  ];

  columnHeaders: { [key: string]: string } = {
    admissionNo: 'מספר מקרה',
    idNum: 'מספר זהות',
    systemUnitName: 'שם יחידה',
    admissionTreatmentUrgencyEntryDate: 'רמת דחיפות',
    admissionTreatmentUrgencyEntryUser: 'משתמש רמת דחיפות',
    admissionTreatmentDecisionTabEntryDate: 'החלטה תאריך ',
    admissionTreatmentDecisionTabEntryUser: 'משתמש  החלטה',
    complaintTabEntryDate: 'תלונה עיקרית',
    complaintTabEntryUser: 'משתמש תלונה עיקרית',
    decisionDescription: 'סיום טיפול במלר"ד',
    dischargeDateTabEntryDate: 'תאריך שחרור בפועל',
    dischargeDateTabEntryUser: 'משתמש תאריך שחרור',
    signaturesInSheetEntryDate: 'חתימת רופא משחרר',
    signaturesInSheetEntryUser: 'משתמש חתימת רופא משחרר',
    adjustedAdmissionNo: 'מספר תיק מותאם',
    releaseDate: 'תאריך שחרור',
    arrivalDate: 'תאריך הגעה',
    responsibleDoctor: 'סוג מיון',
    firstExecutionDate: 'תאריך לחץ דם ראשון',
    lastExecutionDate: 'תאריך לחץ דם אחרון',
    urgencyLevel: 'רמת דחיפות',
    fieldCombo18Translated: ' בדיקה גופנית ?',
  };

  dataSource = new MatTableDataSource<any>([]);
  globalFilter = new FormControl('');
  filterForm: FormGroup;
  isLoading = true;
  totalResults = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      signaturesInSheetEntryDate: [''],
      complaintTabEntryDate: [''],
      dischargeDateTabEntryDate: [''],
      admissionTreatmentDecisionTabEntryDate: [''],
      decisionDescription: [''],
      responsibleDoctor: [''],
      startDate: [''],
      endDate: [''],
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.setupGlobalFilter();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadData(): void {
    this.isLoading = true;
    const url = `${environment.apiUrl}ERInfo/ConsolidatedData`;

    this.http.get<any[]>(url).subscribe(
      (response: any[]) => {
        // Expecting backend to return keys with lowercase first letter
        this.dataSource.data = response || [];
        this.totalResults = this.dataSource.data.length;
        this.isLoading = false;
      },
      (error) => {
        console.error('Error loading data:', error);
        this.isLoading = false;
      }
    );
  }

  setupGlobalFilter(): void {
    // field-specific filters
    this.filterForm.valueChanges.subscribe((filterValues) => {
      this.dataSource.filter = JSON.stringify(filterValues);
      this.totalResults = this.dataSource.filteredData.length;
    });

    // global filter
    this.globalFilter.valueChanges.subscribe(() => {
      this.dataSource.filter = JSON.stringify(this.filterForm.value);
      this.totalResults = this.dataSource.filteredData.length;
    });

    // combined predicate
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const filterValues = JSON.parse(filter);

      // Global search
      const globalValue = this.globalFilter.value?.trim().toLowerCase() || '';
      const columnValues = Object.values(data).join(' ').toLowerCase();
      if (globalValue && !columnValues.includes(globalValue)) {
        return false;
      }

      // Start/End date on arrivalDate
      if (filterValues.startDate || filterValues.endDate) {
        const arrivalDate = new Date(data.arrivalDate);
        if (filterValues.startDate && arrivalDate < new Date(filterValues.startDate)) return false;
        if (filterValues.endDate && arrivalDate > new Date(filterValues.endDate)) return false;
      }

      // signaturesInSheetEntryDate hasValue/noValue
      if (filterValues.signaturesInSheetEntryDate) {
        if (
          filterValues.signaturesInSheetEntryDate === 'hasValue' &&
          (!data.signaturesInSheetEntryDate || String(data.signaturesInSheetEntryDate).trim() === '')
        ) return false;

        if (
          filterValues.signaturesInSheetEntryDate === 'noValue' &&
          data.signaturesInSheetEntryDate &&
          String(data.signaturesInSheetEntryDate).trim() !== ''
        ) return false;
      }

      // complaintTabEntryDate hasValue/noValue
      if (filterValues.complaintTabEntryDate) {
        if (
          filterValues.complaintTabEntryDate === 'hasValue' &&
          (!data.complaintTabEntryDate || String(data.complaintTabEntryDate).trim() === '')
        ) return false;

        if (
          filterValues.complaintTabEntryDate === 'noValue' &&
          data.complaintTabEntryDate &&
          String(data.complaintTabEntryDate).trim() !== ''
        ) return false;
      }

      // dischargeDateTabEntryDate hasValue/noValue
      if (filterValues.dischargeDateTabEntryDate) {
        if (
          filterValues.dischargeDateTabEntryDate === 'hasValue' &&
          (!data.dischargeDateTabEntryDate || String(data.dischargeDateTabEntryDate).trim() === '')
        ) return false;

        if (
          filterValues.dischargeDateTabEntryDate === 'noValue' &&
          data.dischargeDateTabEntryDate &&
          String(data.dischargeDateTabEntryDate).trim() !== ''
        ) return false;
      }

      // admissionTreatmentDecisionTabEntryDate hasValue/noValue
      if (filterValues.admissionTreatmentDecisionTabEntryDate) {
        if (
          filterValues.admissionTreatmentDecisionTabEntryDate === 'hasValue' &&
          (!data.admissionTreatmentDecisionTabEntryDate || String(data.admissionTreatmentDecisionTabEntryDate).trim() === '')
        ) return false;

        if (
          filterValues.admissionTreatmentDecisionTabEntryDate === 'noValue' &&
          data.admissionTreatmentDecisionTabEntryDate &&
          String(data.admissionTreatmentDecisionTabEntryDate).trim() !== ''
        ) return false;
      }

      // responsibleDoctor exact match or (ריק)
      if (filterValues.responsibleDoctor) {
        const doctor = data.responsibleDoctor ? String(data.responsibleDoctor).trim() : '';
        if (filterValues.responsibleDoctor === '(ריק)') {
          if (doctor !== '') return false;
        } else if (filterValues.responsibleDoctor !== doctor) {
          return false;
        }
      }

      // decisionDescription exact match if provided
      if (filterValues.decisionDescription) {
        if (filterValues.decisionDescription !== '' && filterValues.decisionDescription !== data.decisionDescription) {
          return false;
        }
      }

      return true;
    };
  }

  resetFilters(): void {
    this.filterForm.reset({
      signaturesInSheetEntryDate: '',
      complaintTabEntryDate: '',
      dischargeDateTabEntryDate: '',
      admissionTreatmentDecisionTabEntryDate: '',
      decisionDescription: '',
      responsibleDoctor: '',
      startDate: '',
      endDate: '',
    });
    this.globalFilter.setValue('');
    this.dataSource.filter = '';
    this.totalResults = this.dataSource.data.length;
  }

  exportToExcel(): void {
    // Use displayedColumns and lowercase-first keys
    const data = this.dataSource.filteredData.map((item) => {
      return this.displayedColumns.reduce((acc, column) => {
        let value = item[column];

        // Format *Date fields if present
        if (column.endsWith('Date') && value) {
          const date = new Date(value);
          value = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date
            .getDate()
            .toString()
            .padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date
            .getMinutes()
            .toString()
            .padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
        }

        acc[this.columnHeaders[column] || column] = value;
        return acc;
      }, {} as any);
    });

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'דוח_מטופלים.xlsx';
    anchor.click();
    window.URL.revokeObjectURL(url);
  }
}
