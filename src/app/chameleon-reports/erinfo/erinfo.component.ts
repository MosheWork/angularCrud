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
    'ArrivalDate',
    'AdmissionNo',
    'IdNum',
    'SystemUnitName',
    'ResponsibleDoctor', // סוג מיון
    'AdmissionTreatmentUrgencyEntryDate',
    'AdmissionTreatmentUrgencyEntryUser',
    'AdmissionTreatmentDecisionTabEntryDate',
    'AdmissionTreatmentDecisionTabEntryUser',
    'ComplaintTabEntryDate',
    'ComplaintTabEntryUser',
    'DecisionDescription',
    'DischargeDateTabEntryDate',
    'DischargeDateTabEntryUser',
    'SignaturesInSheetEntryDate',
    'SignaturesInSheetEntryUser',
    
    //'EntryUserFullName',
    //'AdjustedAdmissionNo',
    'ReleaseDate',
  
   
  ];
  

  columnHeaders: { [key: string]: string } = {
    AdmissionNo: 'מספר מקרה',
    IdNum: 'מספר זהות',
    SystemUnitName: 'שם יחידה',
    AdmissionTreatmentUrgencyEntryDate: 'רמת דחיפות',
    AdmissionTreatmentUrgencyEntryUser: 'משתמש רמת דחיפות',
    AdmissionTreatmentDecisionTabEntryDate: 'סיבת פנייה',
    AdmissionTreatmentDecisionTabEntryUser: 'משתמש סיבת פנייה',
    ComplaintTabEntryDate: 'תלונה עיקרית',
    ComplaintTabEntryUser: 'משתמש תלונה עיקרית',
    DecisionDescription: 'סיום טיפול במלר"ד',
    DischargeDateTabEntryDate: 'תאריך שחרור בפועל',
    DischargeDateTabEntryUser: 'משתמש תאריך שחרור',
    SignaturesInSheetEntryDate: 'חתימת רופא משחרר',
    SignaturesInSheetEntryUser: 'משתמש חתימת רופא משחרר',
   
    //EntryUserFullName: 'שם משתמש',
    AdjustedAdmissionNo: 'מספר תיק מותאם',
    ReleaseDate: 'תאריך שחרור',
    ArrivalDate: 'תאריך הגעה',
    ResponsibleDoctor: ' סוג מיון' // Hebrew name for Responsible Doctor
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
      ResponsibleDoctor: [''], 
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
      this.totalResults = this.dataSource.filteredData.length; // Update total results after filtering
    });
  
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const filterValues = JSON.parse(filter);
      if (filterValues.startDate || filterValues.endDate) {
        const arrivalDate = new Date(data.ArrivalDate); // Parse ArrivalDate
        if (filterValues.startDate && arrivalDate < new Date(filterValues.startDate)) {
          return false; // Exclude if the ArrivalDate is before startDate
        }
        if (filterValues.endDate && arrivalDate > new Date(filterValues.endDate)) {
          return false; // Exclude if the ArrivalDate is after endDate
        }
      }
      // Filter by Start and End Date (תאריך הגעה)
      if (filterValues.startDate || filterValues.endDate) {
        const arrivalDate = new Date(data.ArrivalDate); // Parse ArrivalDate from data
        if (
          filterValues.startDate &&
          arrivalDate < new Date(filterValues.startDate)
        ) {
          return false; // Exclude if the ArrivalDate is before the start date
        }
        if (
          filterValues.endDate &&
          arrivalDate > new Date(filterValues.endDate)
        ) {
          return false; // Exclude if the ArrivalDate is after the end date
        }
      }
  
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
          (!data.AdmissionTreatmentDecisionTabEntryDate || data.AdmissionTreatmentDecisionTabEntryDate.trim() === '')
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
  
      // Check ResponsibleDoctor filter
      if (filterValues.ResponsibleDoctor) {
        const doctor = data.ResponsibleDoctor ? data.ResponsibleDoctor.trim() : '';
        if (filterValues.ResponsibleDoctor === '(ריק)') {
          if (doctor !== '') {
            return false; // Exclude if value exists but the filter expects '(ריק)'
          }
        } else if (filterValues.ResponsibleDoctor !== doctor) {
          return false; // Exclude if value does not match the selected filter
        }
      }
  
      // Check DecisionDescription filter
      if (filterValues.DecisionDescription) {
        if (
          filterValues.DecisionDescription !== '' &&
          filterValues.DecisionDescription !== data.DecisionDescription
        ) {
          return false; // Exclude if the value doesn't match the selected option
        }
      }
  
      return true; // Include the row if all conditions pass
    };
  
    // Update total results when global filter changes
    this.globalFilter.valueChanges.subscribe(() => {
      this.totalResults = this.dataSource.filteredData.length; // Update total results after global filtering
    });
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
    this.totalResults = this.dataSource.data.length; // Reset total results to the full dataset
  }
  
  
  
  exportToExcel(): void {
    // Map the data to include Hebrew column headers and preserve raw date formats
    const data = this.dataSource.filteredData.map((item) => {
      return this.displayedColumns.reduce((acc, column) => {
        let value = item[column];
  
        // Preserve raw date format for date fields
        if (column.endsWith('Date') && value) {
          const date = new Date(value);
          value = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
        }
  
        acc[this.columnHeaders[column]] = value;
        return acc;
      }, {} as any);
    });
  
    // Create an Excel worksheet
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
  
    // Create a workbook with the worksheet
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
  
    // Write the workbook to a buffer
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
    // Create a Blob from the buffer
    const blob: Blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  
    // Create a download link for the Blob
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'דוח_מטופלים.xlsx'; // Hebrew filename
    anchor.click();
    window.URL.revokeObjectURL(url);
  }
  
  
  
}
