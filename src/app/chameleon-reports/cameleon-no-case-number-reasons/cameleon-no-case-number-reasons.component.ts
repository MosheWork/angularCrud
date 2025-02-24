import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-cameleon-no-case-number-reasons',
  templateUrl: './cameleon-no-case-number-reasons.component.html',
  styleUrls: ['./cameleon-no-case-number-reasons.component.scss']
})
export class CameleonNoCaseNumberReasonsComponent implements OnInit {
  totalResults: number = 0;
  titleUnit: string = 'רשימת סיבות ללא מספר מקרה';
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
  reasonList: string[] = ['Administrative Issue', 'Technical Error', 'Missing Documentation'];
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
    const formControls: any = {};
    this.columns.forEach((column) => {
      formControls[column] = new FormControl('');
    });
    formControls['globalFilter'] = new FormControl('');
    return this.fb.group(formControls);
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
    console.log('Exporting to Excel...');
  }

  openDialog(row: any): void {
    this.dialogData = { IdNum: row.IdNum }; // Store the selected row data
    this.dialogForm.reset();
    const dialogRef = this.dialog.open(this.dialogTemplate, {
      width: '400px',
      data: this.dialogData // Pass data to dialog
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.submitReason(this.dialogData.IdNum);
      }
    });
  }
  
  

  closeDialog(): void {
    this.dialog.closeAll();
  }

  submitReason(IdNum: string): void {
    const requestData = {
      IdNum,
      ReasonForNoCaseNumber: this.dialogForm.value.ReasonForNoCaseNumber,
      Comments: this.dialogForm.value.Comments
    };
    
    this.http.post(environment.apiUrl + 'CameleonNoCaseNumberReasonsMM/insert', requestData)
      .subscribe({
        next: () => {
          console.log('Data inserted successfully');
        },
        error: (error) => {
          console.error('Error inserting data:', error);
        }
      });
  }

  applyFilters() {
    const filters = this.filterForm.value;
    const globalFilter = (filters['globalFilter'] || '').toLowerCase();
  
    this.filteredData = this.dataSource.filter((item) =>
      this.columns.every((column) => {
        const value = item[column];
        const filterValue = filters[column];
  
        const stringValue = typeof value === 'string' ? value.toLowerCase() : String(value).toLowerCase();
        const filterString = typeof filterValue === 'string' ? filterValue.toLowerCase() : filterValue;
  
        return (!filterString || stringValue.includes(filterString)) &&
               (!globalFilter || this.columns.some((col) => String(item[col]).toLowerCase().includes(globalFilter)));
      })
    );
  
    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
    this.matTableDataSource.paginator = this.paginator;
  }
  
}
