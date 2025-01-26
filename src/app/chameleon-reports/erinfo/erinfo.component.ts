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
    'ArrivalDate',
  ];

  columnHeaders: { [key: string]: string } = {
    AdmissionNo: 'מספר תיק',
    IdNum: 'מספר זהות',
    SignaturesInSheetEntryDate: 'חתימות על גיליון - תאריך',
    ComplaintTabEntryDate: 'תאריך תלונה',
    DischargeDateTabEntryDate: 'תאריך שחרור',
    AdmissionTreatmentDecisionTabEntryDate: 'תאריך החלטה לטיפול',
    AdmissionTreatmentUrgencyEntryDate: 'דחיפות טיפול - תאריך',
    DecisionDescription: 'תיאור החלטה',
    SystemUnitName: 'שם יחידה',
    EntryUserFullName: 'שם משתמש',
    AdjustedAdmissionNo: 'מספר תיק מותאם',
    ReleaseDate: 'תאריך שחרור',
    ArrivalDate: 'תאריך הגעה',
  };

  dataSource = new MatTableDataSource<any>([]);
  globalFilter = new FormControl('');
  filterForm: FormGroup;
  isLoading: boolean = true;
  totalResults: number = 0; // Add totalResults property

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      SignaturesInSheetEntryDate: [''],
      ComplaintTabEntryDate: [''],
      DischargeDateTabEntryDate: [''],
      AdmissionTreatmentDecisionTabEntryDate: [''],
      DecisionDescription: [''],
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
        this.dataSource.data = response;
        this.totalResults = response.length; // Update totalResults with the length of the data

        this.isLoading = false;

      },
      (error) => {
        console.error('Error loading data:', error);
        this.isLoading = false;
      }
    );
  }
  setupGlobalFilter(): void {
    this.filterForm.valueChanges.subscribe((filterValues) => {
      this.dataSource.filter = JSON.stringify(filterValues);
    });
  
    this.dataSource.filterPredicate = (data, filter: string) => {
      const filterValues = JSON.parse(filter);
  
      // Check SignaturesInSheetEntryDate filter
      if (filterValues.SignaturesInSheetEntryDate) {
        if (
          filterValues.SignaturesInSheetEntryDate === 'hasValue' &&
          (!data.SignaturesInSheetEntryDate || data.SignaturesInSheetEntryDate.trim() === '')
        ) {
          return false; // Exclude if no value but filter expects a value
        }
        if (
          filterValues.SignaturesInSheetEntryDate === 'noValue' &&
          data.SignaturesInSheetEntryDate &&
          data.SignaturesInSheetEntryDate.trim() !== ''
        ) {
          return false; // Exclude if value exists but filter expects no value
        }
      }
  
      // Check ComplaintTabEntryDate filter
      if (filterValues.ComplaintTabEntryDate) {
        if (
          filterValues.ComplaintTabEntryDate === 'hasValue' &&
          (!data.ComplaintTabEntryDate || data.ComplaintTabEntryDate.trim() === '')
        ) {
          return false;
        }
        if (
          filterValues.ComplaintTabEntryDate === 'noValue' &&
          data.ComplaintTabEntryDate &&
          data.ComplaintTabEntryDate.trim() !== ''
        ) {
          return false;
        }
      }
  
      // Check DischargeDateTabEntryDate filter
      if (filterValues.DischargeDateTabEntryDate) {
        if (
          filterValues.DischargeDateTabEntryDate === 'hasValue' &&
          (!data.DischargeDateTabEntryDate || data.DischargeDateTabEntryDate.trim() === '')
        ) {
          return false;
        }
        if (
          filterValues.DischargeDateTabEntryDate === 'noValue' &&
          data.DischargeDateTabEntryDate &&
          data.DischargeDateTabEntryDate.trim() !== ''
        ) {
          return false;
        }
      }
  
      // Check AdmissionTreatmentDecisionTabEntryDate filter
      if (filterValues.AdmissionTreatmentDecisionTabEntryDate) {
        if (
          filterValues.AdmissionTreatmentDecisionTabEntryDate === 'hasValue' &&
          (!data.AdmissionTreatmentDecisionTabEntryDate ||
            data.AdmissionTreatmentDecisionTabEntryDate.trim() === '')
        ) {
          return false;
        }
        if (
          filterValues.AdmissionTreatmentDecisionTabEntryDate === 'noValue' &&
          data.AdmissionTreatmentDecisionTabEntryDate &&
          data.AdmissionTreatmentDecisionTabEntryDate.trim() !== ''
        ) {
          return false;
        }
      }
  
      // Check DecisionDescription filter
      if (filterValues.DecisionDescription) {
        if (
          filterValues.DecisionDescription === 'hasValue' &&
          (!data.DecisionDescription || data.DecisionDescription.trim() === '')
        ) {
          return false; // Exclude if no value but filter expects a value
        }
        if (
          filterValues.DecisionDescription === 'noValue' &&
          data.DecisionDescription &&
          data.DecisionDescription.trim() !== ''
        ) {
          return false; // Exclude if value exists but filter expects no value
        }
      }
  
      return true; // Include the row if all conditions pass
    };
  }
  

  resetFilters(): void {
    this.filterForm.reset({
      SignaturesInSheetEntryDate: '',
      ComplaintTabEntryDate: '',
      DischargeDateTabEntryDate: '',
      AdmissionTreatmentDecisionTabEntryDate: '',
      DecisionDescription: '',
    });
    this.globalFilter.setValue('');
    this.dataSource.filter = '';
  }
  
  

  exportToExcel(): void {
    const data = this.dataSource.data.map((item) => {
      return this.displayedColumns.reduce((acc, column) => {
        acc[column] = item[column];
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
    anchor.download = 'ERInfoData.xlsx';
    anchor.click();
    window.URL.revokeObjectURL(url);
  }
}
