import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { environment } from '../../../environments/environment';
import { MAT_DATE_FORMATS } from '@angular/material/core';

export const MY_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'DD/MM/YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

interface FormControls {
  [key: string]: FormControl;
}

@Component({
  selector: 'app-skin-integrity-report',
  templateUrl: './skin-integrity-report.component.html',
  styleUrls: ['./skin-integrity-report.component.scss']
})
export class SkinIntegrityReportComponent implements OnInit {
  totalResults: number = 0;
  titleUnit: string = 'אומדן שלמות העור ';
  Title1: string = ' סה"כ תוצאות: ';  // Title1 for display
  Title2: string = '';              // Title2 for display

  showGraph: boolean = false;       // Flag for showing graph
  graphData: any[] = [];            // Data for the graph

  columns: string[] = [
    'Name',
    'Id_Num',
    'Admission_No',
    'First_Name',
    'Last_Name',
    'Age_Years',
    'Record_Date',
    'Entry_Date',
    'Pain',
    'Description_Text',
    'Degree_Text',
    'Location_Text',
    'Made_In_Text',
    'Support_Device_Text'
  ];

  dataSource: any[] = [];
  filteredData: any[] = [];
  matTableDataSource: MatTableDataSource<any>;

  filterForm: FormGroup;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private fb: FormBuilder, private router: Router) {
    // Initialize the form group and data source
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
  }

  ngOnInit() {
    // Fetch the data from the API
    this.http.get<any[]>(environment.apiUrl + 'SkinIntegrityReportAPI').subscribe((data) => {
      this.dataSource = data;
      this.filteredData = [...data];
      this.matTableDataSource = new MatTableDataSource(this.filteredData);
      this.matTableDataSource.paginator = this.paginator;
      this.matTableDataSource.sort = this.sort;

      // Add value changes listener to all form controls
      this.columns.forEach((column) => {
        this.filterForm.get(column)?.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => this.applyFilters());
      });

      // Global filter value change listener
      this.filterForm.valueChanges.subscribe(() => {
        this.applyFilters();
        this.paginator.firstPage(); // Reset to first page after filtering
      });

      // Initial filter application
      this.applyFilters();
    });
  }

  // Create the filter form with form controls for all columns and global filter
  private createFilterForm(): FormGroup {
    const formControls: FormControls = {};
    this.columns.forEach((column) => {
      formControls[column] = new FormControl(''); // Add form controls for each column
    });
    formControls['globalFilter'] = new FormControl(''); // Add the global filter form control
    return this.fb.group(formControls);
  }

  // Apply the filters to the data source
  applyFilters() {
    const filters = this.filterForm.value;
    const globalFilter = (filters['globalFilter'] || '').toLowerCase();
  
    // Apply filters to the data source
    this.filteredData = this.dataSource.filter((item) =>
      this.columns.every((column) => {
        const value = item[column];
        const filterValue = filters[column];
  
        if (column === 'Record_Date' || column === 'Entry_Date') {
          // Handle date-specific filter
          if (!filterValue) return true; // If no date filter is applied
          const formattedDate = this.formatDate(new Date(value));
          const filterDate = this.formatDate(new Date(filterValue));
          return formattedDate === filterDate; // Compare dates in DD/MM/YYYY format
        }
  
        const stringValue = typeof value === 'string' ? value.toLowerCase() : String(value).toLowerCase();
        const filterString = typeof filterValue === 'string' ? filterValue.toLowerCase() : filterValue;
  
        // Filter based on individual column filters and the global search filter
        return (!filterString || stringValue.includes(filterString)) &&
               (!globalFilter || this.columns.some((col) => String(item[col]).toLowerCase().includes(globalFilter)));
      })
    );
  
    // Update total results and table data
    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
    this.matTableDataSource.paginator = this.paginator;
    this.graphData = this.filteredData;  // Update graph data
  }
  
  // Utility method to format the date in DD/MM/YYYY format
  formatDate(date: Date): string {
    const day = ('0' + date.getDate()).slice(-2);
    const month = ('0' + (date.getMonth() + 1)).slice(-2); // Months are 0-based
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  

  // Reset filters and reapply
  resetFilters() {
    this.filterForm.reset();  // Reset all filters
    this.filterForm.get('globalFilter')?.setValue('');  // Clear global filter
    this.applyFilters();  // Reapply filters
  }

  // Method to get column labels for display
  getColumnLabel(column: string): string {
    const columnLabels: Record<string, string> = {
      Name: 'שם',
      Id_Num: 'ת.ז.',
      Admission_No: 'מספר אשפוז',
      First_Name: 'שם פרטי',
      Last_Name: 'שם משפחה',
      Age_Years: 'גיל',
      Record_Date: 'תאריך קבלה',
      Entry_Date: 'תאריך דיווח',
      Pain: 'כאב',
      Description_Text: 'תיאור',
      Degree_Text: 'דרגה',
      Location_Text: 'מיקום',
      Made_In_Text: 'נוצר ב',
      Support_Device_Text: 'התקן תמיכה'
    };
    return columnLabels[column] || column;
  }

  // Export filtered data to Excel
  exportToExcel() {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filteredData);
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'skin_integrity_report.xlsx';
    link.click();
  }

  // Toggle graph view
  navigateToGraphPage() {
    this.showGraph = !this.showGraph;
  }

  // Navigate to the home page
  goToHome() {
    this.router.navigate(['/MainPageReports']);
  }
}
