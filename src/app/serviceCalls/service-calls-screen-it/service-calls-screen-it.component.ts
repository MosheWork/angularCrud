import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import * as XLSX from 'xlsx';
import { environment } from '../../../environments/environment'; // Ensure this path is correct.
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { RowEditDialogComponent } from '../row-edit-dialog/row-edit-dialog.component'; // Adjust the path as necessary




@Component({
  selector: 'app-service-calls-screen-it',
  templateUrl: './service-calls-screen-it.component.html',
  styleUrls: ['./service-calls-screen-it.component.scss'],
  providers: [DatePipe] // Add DatePipe to the providers array

})
export class ServiceCallsScreenITComponent implements OnInit {
 
  
  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort!: MatSort;

  loginUserName = '';

  filterForm: FormGroup; // Keeping this as it is used for filtering in the HTML form.

  // Removed graphData, dataSource, filteredData, answerTextOptions, and answerTextTypeOptions as they are not referenced in the provided HTML.

  matTableDataSource = new MatTableDataSource<any>(); // Initialize with any type for now as the specific type is not provided.

  // Columns to be displayed in the table are specified here.
  columns: string[] = [
    'timeOpened', 'timeClosed', 'priority', 'status', 'userRequested',
    //'callbackPhone',
     'title', //'problemDescription', 'solutionText',
    //'comments', 'ip', 'departmentName',
     'mainCategory',
     'category2',
    'category3', 'teamInCharge'
  ];

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private datePipe: DatePipe, // Inject the DatePipe
    public dialog: MatDialog 

    // private router: Router // Removed router as it's not used in the HTML provided.
  ) {
    this.filterForm = this.fb.group({
      globalFilter: '', // This is the only form control used in the HTML provided.
    });
  }

  
  ngOnInit() {
    this.loginUserName = localStorage.getItem('loginUserName') || '';

    this.loadData();
    
    this.matTableDataSource.filterPredicate = (data: any, filter: string) => {
      const transformedFilter = filter.trim().toLowerCase();
      // Enhance the logic here to include all relevant data fields
      const dataStr = this.columns.map(column => data[column]).filter(value => value).join(' ').toLowerCase();
      return dataStr.includes(transformedFilter);
    };
    
    this.filterForm.get('globalFilter')?.valueChanges
      .pipe(
        debounceTime(150), // Control how quickly the filter applies after typing stops
        distinctUntilChanged()
      )
      .subscribe(value => {
        this.applyFilters();
      });
  }
  

  loadData() {
    const apiUrl = environment.apiUrl + 'ServiceCallsTable'; // Update with your actual API URL.
    this.http.get<any[]>(apiUrl).subscribe(data => {
      // Format the dates before assigning to the data source
      const formattedData = data.map(item => ({
        ...item,
        timeOpened: this.datePipe.transform(item.timeOpened, 'yyyy-MM-dd HH:mm:ss'),
        timeClosed: this.datePipe.transform(item.timeClosed, 'yyyy-MM-dd HH:mm:ss')
      }));
      this.matTableDataSource.data = formattedData;
      this.matTableDataSource.paginator = this.paginator;
      this.matTableDataSource.sort = this.sort;
    });
  }
  

  applyFilters() {
    const globalFilter = this.filterForm.get('globalFilter')?.value || '';
    this.matTableDataSource.filter = globalFilter.trim().toLowerCase();
  }
  
  exportToExcel() {
    // Function is used in the HTML provided.
    const excelData = this.convertToExcelFormat(this.matTableDataSource.data);
    XLSX.writeFile(excelData, 'ServiceCallsData.xlsx');
  }

  private convertToExcelFormat(data: any[]): XLSX.WorkBook {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data'); // Correct method name.
    return workbook;
  }

  getColumnLabel(column: string): string {
    // Labels are provided for header cells in the HTML.
    const labels: Record<string, string> = {
      timeOpened: 'זמן בקשה',
      timeClosed: ' תאריך סגירה',
      priority: 'עדיפות',
      status: 'סטטוס',
      userRequested: 'משתמש מבקש',
      callbackPhone: 'טלפון לחזרה',
      title: 'כותרת',
      problemDescription: 'פירוט התקלה',
      solutionText: 'פתרון',
      comments: 'הערות',
      ip: 'IP',
      departmentName: 'מקום התקלה',
      mainCategory: 'קטגוריה ראשית',
      category2: 'קטגוריה משנית',
      category3: 'קטגוריה שלישית',
      teamInCharge: 'צוות מטפל',
    };
    return labels[column] || column;
  }
 
// ...

openEditDialog(rowData: any): void {
  console.log('Opening dialog with data:', rowData); // Add this to check the data

  const dialogRef = this.dialog.open(RowEditDialogComponent, {
    width: '600px',
    data: rowData, // Pass the row data to the dialog
    panelClass: 'custom-dialog-container' // Custom class for styling
  });
  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      // Access serviceCallID directly from result using the correct case
      this.updateServiceCall(result.serviceCallID, result); 
    } else {
      console.log('The dialog was closed without saving.');
    }
  });
  
}

updateServiceCall(serviceCallID: number, serviceCallData: any): void {
  // Create a new object from serviceCallData excluding TimeOpened and TimeClosed
  const { TimeOpened, TimeClosed, ...payloadWithoutDates } = serviceCallData;

  // Prepare the payload as expected by your API
  const payload = {
    serviceCallUpdate: { ...payloadWithoutDates }
  };
  console.log('payload: '+payload)
  const apiUrl = `${environment.apiUrl}ServiceCallsTable/${serviceCallID}`;

  // Use the modified payload for the PUT request
  this.http.put(apiUrl, payload).subscribe({
    next: (response) => {
      console.log('Service call updated successfully', response);
      this.loadData(); // Refresh the data in your table
    },
    error: (error) => {
      console.error('Error updating service call', error);
      // Additional error handling...
    }
  });
}



// Helper function to convert object keys from camelCase to PascalCase
toPascalCase(obj: any): any {
  return Object.keys(obj).reduce<Record<string, any>>((acc, key) => {
    const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
    acc[pascalKey] = obj[key];
    return acc;
  }, {});
}








}
