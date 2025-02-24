import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-cameleon-no-case-number-reasons',
  templateUrl: './cameleon-no-case-number-reasons.component.html',
  styleUrls: ['./cameleon-no-case-number-reasons.component.scss']
})
export class CameleonNoCaseNumberReasonsComponent implements OnInit {
  totalResults: number = 0;
  titleUnit: string = 'רשימת מטופלים מספר מקרה';
  Title1: string = 'סה"כ תוצאות: ';
  Title2: string = '';

  columns: string[] = [
    'IdNum',
    'ReasonForNoCaseNumber',
    'Comments',
    'AdmissionNo',
    'UnitName',
    'FirstName',
    'LastName',
    'RecordDate',
    'MedicalRecord'
  ];

  columnHeaders: { [key: string]: string } = {
    IdNum: 'תעודת זהות',
    ReasonForNoCaseNumber: 'סיבת היעדר מספר מקרה',
    Comments: 'הערות',
    AdmissionNo: 'מספר אישפוז',
    UnitName: 'יחידה',
    FirstName: 'שם פרטי',
    LastName: 'שם משפחה',
    RecordDate: 'תאריך רישום',
    MedicalRecord: 'רשומה רפואית'
  };
  dialogData: any;

  dataSource: any[] = [];
  filteredData: any[] = [];
  matTableDataSource: MatTableDataSource<any>;
  loading: boolean = true;

  filterForm: FormGroup;
  dialogForm: FormGroup;
  reasonList: string[] = ['תשלח לי רשימת סיבות', ''];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('dialogTemplate') dialogTemplate!: TemplateRef<any>;

  constructor(private http: HttpClient, private fb: FormBuilder, public dialog: MatDialog) {
    this.filterForm = this.createFilterForm();
    this.dialogForm = this.createDialogForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
  }

  ngOnInit() {
    this.loading = true;
    this.http.get<any[]>(environment.apiUrl + 'CameleonNoCaseNumberReasonsMM').subscribe({
      next: (data) => {
        this.dataSource = data;
        this.totalResults=data.length;
        this.filteredData = [...data];
        this.matTableDataSource = new MatTableDataSource(this.filteredData);
        setTimeout(() => {
          this.matTableDataSource.paginator = this.paginator;
          this.matTableDataSource.sort = this.sort;
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching data:', error);
        this.loading = false;
      }
    });
  }

  private createFilterForm(): FormGroup {
    return this.fb.group({
      startEntryDate: new FormControl(null), // Start Date
      endEntryDate: new FormControl(null),   // End Date
      globalFilter: new FormControl('')      // Global Search
    });
  }

  private createDialogForm(): FormGroup {
    return this.fb.group({
      ReasonForNoCaseNumber: new FormControl(''),
      Comments: new FormControl('')
    });
  }

  resetFilters() {
    this.filterForm.reset();
    this.filterForm.get('globalFilter')?.setValue('');
    this.applyFilters();
  }

  exportToExcel() {
    if (!this.filteredData || this.filteredData.length === 0) {
      console.warn('No data available to export.');
      return;
    }
  
    // ✅ Hebrew column headers mapping
    const columnHeaders: { [key: string]: string } = {
      IdNum: 'תעודת זהות',
      ReasonForNoCaseNumber: 'סיבת היעדר מספר מקרה',
      Comments: 'הערות',
      AdmissionNo: 'מספר אישפוז',
      UnitName: 'יחידה',
      FirstName: 'שם פרטי',
      LastName: 'שם משפחה',
      RecordDate: 'תאריך רישום',
      MedicalRecord: 'רשומה רפואית'
    };
  
    // ✅ Format data with Hebrew headers
    const formattedData = this.filteredData.map(item => {
      let newItem: any = {};
      Object.keys(item).forEach(key => {
        if (columnHeaders[key]) {
          newItem[columnHeaders[key]] = key === 'RecordDate' ? this.formatDate(item[key]) : item[key]; // Format date
        }
      });
      return newItem;
    });
  
    // ✅ Convert to Excel sheet
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook: XLSX.WorkBook = { Sheets: { 'מטופלים ללא מספר מקרה': worksheet }, SheetNames: ['מטופלים ללא מספר מקרה'] };
  
    // ✅ Export as Excel file
    XLSX.writeFile(workbook, 'מטופלים_ללא_מספר_מקרה.xlsx');
  }
  
  // **Helper function to format dates**
  private formatDate(dateString: string): string {
    if (!dateString) return 'אין תיעוד';
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  
  openDialog(data: any) {
    this.dialogData = data; // Store the selected row data
  
    this.dialogForm.patchValue({
      ReasonForNoCaseNumber: data.ReasonForNoCaseNumber || '', // Set existing reason if available
      Comments: data.Comments || '' // Set existing comments if available
    });
  
    this.dialog.open(this.dialogTemplate, {
      width: '1200px', // Set dialog width (change as needed)
      maxWidth: '90vw', // Prevent it from becoming too large on small screens
      height: 'auto', // Adjust height automatically
      panelClass: 'custom-dialog-container' // Apply custom styles if needed
    });
  }
  
  

  closeDialog(): void {
    this.dialog.closeAll();
  }

  submitReason(idNum: string) {
    if (!this.dialogForm.valid) return; // Validate form
  
    const requestData = {
      IdNum: idNum,
      ReasonForNoCaseNumber: this.dialogForm.value.ReasonForNoCaseNumber,
      Comments: this.dialogForm.value.Comments
    };
  
    // Check if record exists (if ReasonForNoCaseNumber exists, it means the record already exists)
    const existingRecord = this.dataSource.find(record => record.IdNum === idNum);
  
    const requestType = existingRecord ? 'put' : 'post';
    const requestUrl = environment.apiUrl + `CameleonNoCaseNumberReasonsMM/${existingRecord ? 'update' : 'insert'}`;
  
    this.http[requestType](requestUrl, requestData, {
      headers: { 'Content-Type': 'application/json' }
    }).subscribe({
      next: (response) => {
        console.log('Data submitted successfully:', response);
        this.dialog.closeAll(); // Close dialog
        setTimeout(() => location.reload(), 500); // Reload page after submission
      },
      error: (error) => {
        console.error('Error submitting data:', error);
      }
    });
  }
  
  
  

  applyFilters() {
    const filters = this.filterForm.value;
    const startDate = filters.startEntryDate ? new Date(filters.startEntryDate).setHours(0, 0, 0, 0) : null;
    const endDate = filters.endEntryDate ? new Date(filters.endEntryDate).setHours(23, 59, 59, 999) : null;
    const globalFilter = filters.globalFilter ? filters.globalFilter.toLowerCase() : '';
  
    console.log("Start Date:", startDate, "End Date:", endDate); // Debugging
    
    this.filteredData = this.dataSource.filter((item) => {
      let recordDate = item.RecordDate ? new Date(item.RecordDate).setHours(0, 0, 0, 0) : null;
  
      console.log("Checking RecordDate:", item.RecordDate, "Converted:", recordDate); // Debugging
  
      // Date filter logic
      const isWithinDateRange = (!startDate || (recordDate && recordDate >= startDate)) &&
                                (!endDate || (recordDate && recordDate <= endDate));
  
      // Global search filter
      const matchesGlobalFilter = !globalFilter || Object.values(item).some(value =>
        value?.toString().toLowerCase().includes(globalFilter)
      );
  
      return isWithinDateRange && matchesGlobalFilter;
    });
  
    console.log("Filtered Data:", this.filteredData); // Debugging
    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
  }
  
  
  
}
