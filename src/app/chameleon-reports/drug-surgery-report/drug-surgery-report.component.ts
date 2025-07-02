import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, startWith, tap } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import { environment } from '../../../environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { ProcedureICD9ManagerDialogComponent } from './procedure-icd9-manager-dialog/procedure-icd9-manager-dialog.component';
import { AuthenticationService } from '../../../app/services/authentication-service/authentication-service.component';

@Component({
  selector: 'app-drug-surgery-report',
  templateUrl: './drug-surgery-report.component.html',
  styleUrls: ['./drug-surgery-report.component.scss'],
})
export class DrugSurgeryReportComponent implements OnInit {
  filteredResponsibilities: Observable<string[]> | undefined;
  showGraph = false;
  Title1 = 'דו״ח תרופות וניתוחים - ';
  Title2 = 'תוצאות סה״כ: ';
  titleUnit = 'מחלקת ניתוחים ';
  totalResults = 0;
  isLoading = false;
  UserName: string = '';
  profilePictureUrl: string = 'assets/default-user.png'; // fallback default


  profilePicture: string = ''; // URL or base64
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  filterForm: FormGroup;
  graphData: any[] = [];
  dataSource: any[] = [];
  filteredData: any[] = [];
  matTableDataSource: MatTableDataSource<any>;


  
  
  columns: string[] = [
    'AdmissionNo',
    //'OrderID',
    'Drug',
    'BasicName',
    'DrugGiveTime',
    'OperationStartTime',
    'OperationEndTime',
    'MinutesDiff',
    //'EntryUser',
    'GiveOrderName',
    'MainDoctor',
    'Anesthetic',
    //'ExecStatusName',
    'ProcedureICD9',
    'ProcedureName',
    'SurgeryDepartment',
'OperationDurationHHMM',
    'DrugGivenInOtherUnitsAfterOp',
    'HoursFromOperationToDrug'
  ];
  

  constructor(private http: HttpClient, private fb: FormBuilder, private router: Router,private dialog: MatDialog,private authenticationService: AuthenticationService,) {
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
  }

  ngOnInit() {
    
    this.autoLogin();
    this.http.get<any[]>(environment.apiUrl + 'DrugSurgeryReport').subscribe((data) => {
      this.dataSource = data;
      this.filteredData = [...data];
      this.matTableDataSource = new MatTableDataSource(this.filteredData);
      this.matTableDataSource.paginator = this.paginator;
      this.matTableDataSource.sort = this.sort;
      this.calculateSummary(data); 


      this.columns.forEach((column) => {
        this.filterForm.get(column)?.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => this.applyFilters());
      });

      this.filterForm.valueChanges.subscribe(() => {
        this.applyFilters();
        this.paginator.firstPage();
      });

      this.applyFilters();
    });


    this.authenticationService.getAuthentication().subscribe(
      (response) => {
        console.log('✅ Authentication Successful:', response.message);
        let user = response.message.split('\\')[1];
        console.log('🧑 User:', user);
        this.getUserDetailsFromDBByUserName(user.toUpperCase());
      },
      (error) => {
        console.error('❌ Authentication Failed:', error);
      }
    );
    
  }
  getUserDetailsFromDBByUserName(username: string): void {
    this.http.get<any>(`${environment.apiUrl}ServiceCRM/GetEmployeeInfo?username=${username.toUpperCase()}`)
  .subscribe(
    (data) => {
      this.UserName = data.UserName;
      this.profilePictureUrl = `${data.ProfilePicture}`; // adjust path if needed
    },
    (error) => {
      console.error('Error fetching employee info:', error);
    }
  );

  }

  autoLogin() {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const url = environment.apiUrl + 'User/current';
    this.http.get(url, { headers, withCredentials: true }).subscribe(
      (response: any) => console.log(response),
      (error) => console.error('Error:', error)
    );
  }

  private createFilterForm() {
    const formControls: any = {};
    this.columns.forEach((column) => {
      formControls[column] = new FormControl('');
    });

    formControls['pageSize'] = new FormControl(10);
    formControls['pageIndex'] = new FormControl(0);
    formControls['globalFilter'] = new FormControl('');

    return this.fb.group(formControls);
  }

  getFormControl(column: string): FormControl {
    return (this.filterForm.get(column) as FormControl) || new FormControl('');
  }
  

  getColumnLabel(column: string): string {
    const columnLabels: Record<string, string> = {
      AdmissionNo: 'מספר מקרה',
      OrderID: 'מזהה הזמנה',
      Drug: 'קוד אנטיביוטיקה',
      BasicName: 'אנטיביוטיקה ',
      DrugGiveTime: 'זמן מתן תרופה',
      OperationStartTime: 'זמן תחילת ניתוח',
      OperationEndTime:'זמן סיום ניתוח',
      MinutesDiff: 'זמן ממתן תרופה עד חתך (בדקות)',
      EntryUser: 'מקודד',
      GiveOrderName: 'נותן התרופה',
      MainDoctor: 'רופא מנתח',
      Anesthetic: 'מרדים',
      ExecStatusName: 'סטטוס מתן',
      ProcedureICD9: 'קוד פרוצדורה',
      ProcedureName: 'שם פרוצדורה',
      SurgeryDepartment: 'מחלקת ניתוח',
      OperationDurationHHMM:'משך ניתוח',
      DrugGivenInOtherUnitsAfterOp: 'נרשמה תרופה במחלקה אחרת לאחר ניתוח',
      HoursFromOperationToDrug: '  המשך מתן תרופה לאחר סיום ניתוח (שעות)  '
    };
    return columnLabels[column] || column;
  }
  

  resetFilters() {
    this.filterForm.reset();
    this.filterForm.get('globalFilter')?.setValue('');
    this.applyFilters();
    this.filteredData = [...this.dataSource];
    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
    this.matTableDataSource.paginator = this.paginator;
  }

  applyFilters() {
    const filters = this.filterForm.value;
    const globalFilter = filters['globalFilter'].toLowerCase();

    this.filteredData = this.dataSource.filter((item) =>
      this.columns.every((column) => {
        const value = String(item[column] || '').toLowerCase();
        return !filters[column] || value.includes(filters[column]);
      }) &&
      (globalFilter === '' ||
        this.columns.some((column) =>
          String(item[column] || '').toLowerCase().includes(globalFilter)
        ))
    );

    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
    this.matTableDataSource.paginator = this.paginator;
    this.graphData = this.filteredData;
  }

  exportToExcel() {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filteredData);
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'drug_surgery_report.xlsx';
    link.click();
  }

  navigateToGraphPage() {
    this.showGraph = !this.showGraph;
  }
  getCellClass(column: string, value: any): string {
    if (column === 'MinutesDiff') {
      if (value >= 60) return 'cell-red';
      else if (value >= 30) return 'cell-green';
      else if (value >= 0) return 'cell-orange';
    }
    return '';
  }
  summary = { green: 0, orange: 0, red: 0, negativeOrEmpty: 0, total: 0 };
  selectedColor: string | null = null;
  originalData: any[] = [];
  
  calculateSummary(data: any[]): void {
    this.summary = { green: 0, orange: 0, red: 0, negativeOrEmpty: 0, total: data.length };
    this.originalData = data; // Save for clearing later
  
    data.forEach(row => {
      const minutes = Number(row.MinutesDiff);
      if (minutes == null || isNaN(minutes) || minutes < 0) {
        this.summary.negativeOrEmpty++;
      } else if (minutes > 60) {
        this.summary.red++;
      } else if (minutes >= 30) {
        this.summary.green++;
      } else if (minutes >= 0) {
        this.summary.orange++;
      }
    });
  }
  
  applyColorFilter(color: string): void {
    this.selectedColor = color;
  
    const filtered = this.originalData.filter(row => {
      const minutes = Number(row.MinutesDiff);
      if (color === 'green') return minutes >= 30 && minutes <= 60;
      if (color === 'orange') return minutes >= 0 && minutes < 30;
      if (color === 'red') return minutes > 60;
      return true;
    });
  
    this.matTableDataSource.data = filtered;
  }
  
  clearColorFilter(): void {
    this.selectedColor = null;
    this.matTableDataSource.data = this.originalData;
  }
  openProcedureDialog(): void {
    this.dialog.open(ProcedureICD9ManagerDialogComponent, {
      width: '1200px',
      height: '1000px' 

    });
  }

  canManageICD9(): boolean {
    return this.UserName === 'mmaman' || this.UserName === 'admin'; 
    // ✅ Add your allowed usernames here
  }

  applyNegativeOrEmptyFilter(): void {
    this.selectedColor = 'negativeOrEmpty';
  
    const filtered = this.originalData.filter(row => {
      const minutes = Number(row.MinutesDiff);
      return minutes == null ||  isNaN(minutes) || minutes < 0;
    });
  
    this.matTableDataSource.data = filtered;
  }
  
}
