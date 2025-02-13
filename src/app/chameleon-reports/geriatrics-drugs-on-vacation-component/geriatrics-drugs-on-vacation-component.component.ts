import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog'; // Import MatDialog
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { environment } from '../../../environments/environment';
import { DrugDetailsDialogComponent } from './drug-details-dialog/drug-details-dialog.component'; // Import dialog component

@Component({
  selector: 'app-geriatrics-drugs-on-vacation',
  templateUrl: './geriatrics-drugs-on-vacation-component.component.html',
  styleUrls: ['./geriatrics-drugs-on-vacation-component.component.scss'],
})
export class GeriatricsDrugsOnVacationComponent implements OnInit {
  titleUnit: string = 'תרופות לגריאטרים';
  Title1: string = ' רשימת תרופות ';
  Title2: string = 'סה"כ תוצאות ';
  totalResults: number = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  uniqueNames: string[] = []; // Store unique department names

  filterForm: FormGroup;
  dataSource: any[] = [];
  filteredData: any[] = [];
  matTableDataSource: MatTableDataSource<any>;
  columns: string[] = [
    'Name',
    'Id_Num',
    'First_Name',
    'Last_Name',
    'Father_Name',
    'Admission_No',
  ];

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private router: Router,
    private dialog: MatDialog // Inject MatDialog
  ) {
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
  }

  ngOnInit() {
    this.http
      .get<any[]>(
        `${environment.apiUrl}GeriatricsDrugsOnVacation/GetAllPatients`
      )
      .subscribe(
        (data) => {
          this.dataSource = data;
          this.filteredData = [...data];
          this.matTableDataSource = new MatTableDataSource(this.filteredData);
          this.matTableDataSource.paginator = this.paginator;
          this.matTableDataSource.sort = this.sort;
          this.uniqueNames = [...new Set(data.map((item) => item.Name))];

          this.columns.forEach((column) => {
            this.getFormControl(column)
              .valueChanges.pipe(debounceTime(300), distinctUntilChanged())
              .subscribe(() => this.applyFilters());
          });

          this.filterForm
            .get('globalFilter')
            ?.valueChanges.pipe(debounceTime(300), distinctUntilChanged())
            .subscribe(() => this.applyFilters());

          this.applyFilters();
        },
        (error) => console.error('Error fetching data:', error)
      );
  }

  private createFilterForm(): FormGroup {
    const formControls: { [key: string]: FormControl } = {};
    this.columns.forEach((column) => {
      formControls[column] = new FormControl('');
    });

    formControls['globalFilter'] = new FormControl('');
    return this.fb.group(formControls);
  }

  applyFilters() {
    const filters = this.filterForm.value;
    const globalFilter = filters['globalFilter']?.toLowerCase() || '';
    const selectedNames: string[] = filters['Name']; // Get selected names
  
    this.filteredData = this.dataSource.filter(
      (item) =>
        // Multi-select filter for Name
        (selectedNames.length === 0 || selectedNames.includes(item.Name)) &&
        this.columns.every((column) => {
          if (column === 'Name') return true; // Skip Name because it has its own filter
  
          const columnFilter = filters[column]?.toLowerCase() || '';
          const value = String(item[column] || '').toLowerCase();
          return !columnFilter || value.includes(columnFilter);
        }) &&
        (globalFilter === '' ||
          this.columns.some((column) =>
            String(item[column] || '')
              .toLowerCase()
              .includes(globalFilter)
          ))
    );
  
    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
  }
  
  getColumnLabel(column: string): string {
    const columnLabels: Record<string, string> = {
      Name: 'מחלקה ',
      Id_Num: 'תעודת זהות',
      First_Name: 'שם פרטי',
      Last_Name: 'שם משפחה',
      Admission_No: 'מספר מקרה',
      Father_Name: 'שם האב',
    };
    return columnLabels[column] || column;
  }

  getFormControl(column: string): FormControl {
    return this.filterForm.get(column) as FormControl;
  }

  resetFilters() {
    this.filterForm.reset();
  
    // Explicitly reset multi-select (Name)
    this.filterForm.get('Name')?.setValue([]); 
  
    // Explicitly reset the global filter
    this.filterForm.get('globalFilter')?.setValue('');
  
    // Apply filters again to reflect changes
    this.applyFilters();
  }

  exportToExcel() {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(
      this.filteredData
    );
    const workbook: XLSX.WorkBook = {
      Sheets: { data: worksheet },
      SheetNames: ['data'],
    };
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'GeriatricsDrugsOnVacation.xlsx';
    link.click();
  }

  openDrugDetails(row: any): void {
    const idNum = row.Id_Num; // Extract the ID number
    const apiUrl = `${environment.apiUrl}GeriatricsDrugsOnVacation/GetPatientDetails/${idNum}`;

    // Fetch the drug details from the API
    this.http.get<any[]>(apiUrl).subscribe(
      (data) => {
        console.log('Fetched drug details:', data); // Log API response

        // Open the dialog and pass both patient details and drug details
        this.dialog.open(DrugDetailsDialogComponent, {
          width: '60vw', // Dialog width
          maxWidth: '100vw', // Prevent shrinking
          height: 'auto', // Adjust height
          data: {
            patientDetails: {
              Id_Num: row.Id_Num,
              First_Name: row.First_Name,
              Last_Name: row.Last_Name,
              Father_Name: row.Father_Name,
              Admission_No: row.Admission_No,
            },
            drugDetails: Array.isArray(data) ? data : [], // Ensure drugDetails is an array
          },
        });
      },
      (error) => {
        console.error('Error fetching active drugs:', error);
      }
    );
  }

  // showDrugDetailsDialog(drugDetails: any[]): void {
  //   this.dialog.open(DrugDetailsDialogComponent, {
  //     width: '600px',
  //     data: drugDetails, // Pass the data to the dialog
  //   });
  // }

  goToHome() {
    this.router.navigate(['/MainPageReports']);
  }
}
