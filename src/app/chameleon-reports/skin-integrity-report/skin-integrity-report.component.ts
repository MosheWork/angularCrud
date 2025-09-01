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
  Title1: string = ' סה"כ תוצאות: ';
  Title2: string = '';

  showGraph: boolean = false;
  graphData: any[] = [];

  // ⬇️ first-letter lower keys
  columns: string[] = [
    'name',
    'id_Num',
    'admission_No',
    'first_Name',
    'last_Name',
    'age_Years',
    'record_Date',
    'entry_Date',
    'pain',
    'description_Text',
    'degree_Text',
    'location_Text',
    'made_In_Text',
    'support_Device_Text',
    'release_Date'
  ];

  dataSource: any[] = [];
  filteredData: any[] = [];
  matTableDataSource: MatTableDataSource<any>;

  filterForm: FormGroup;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private fb: FormBuilder, private router: Router) {
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
  }

  ngOnInit() {
    this.http.get<any[]>(environment.apiUrl + 'SkinIntegrityReportAPI').subscribe((data) => {
      this.dataSource = data;
      this.filteredData = [...data];
      this.matTableDataSource = new MatTableDataSource(this.filteredData);
      this.matTableDataSource.paginator = this.paginator;
      this.matTableDataSource.sort = this.sort;

      // per-column filters
      this.columns.forEach((column) => {
        this.filterForm.get(column)?.valueChanges
          .pipe(debounceTime(300), distinctUntilChanged())
          .subscribe(() => this.applyFilters());
      });

      // global filters
      this.filterForm.valueChanges.subscribe(() => {
        this.applyFilters();
        this.paginator.firstPage();
      });

      this.applyFilters();
    });
  }

  // form with lower-first control names + ReleaseStatus
  private createFilterForm(): FormGroup {
    const formControls: FormControls = {};
    this.columns.forEach((column) => {
      formControls[column] = new FormControl('');
    });

    formControls['globalFilter'] = new FormControl('');
    formControls['ReleaseStatus'] = new FormControl(''); // '', 'discharged', 'hospitalized'

    return this.fb.group(formControls);
  }

  applyFilters() {
    const filters = this.filterForm.value;
    const globalFilter = (filters['globalFilter'] || '').toLowerCase();
    const releaseStatus = filters['ReleaseStatus'];

    this.filteredData = this.dataSource.filter((item) => {
      const matchesColumns = this.columns.every((column) => {
        const value = item[column];
        const filterValue = filters[column];

        // date equality for record_Date / entry_Date
        if (column === 'record_Date' || column === 'entry_Date') {
          if (!filterValue) return true;
          const formattedValue = this.formatDate(new Date(value));
          const formattedFilter = this.formatDate(new Date(filterValue));
          return formattedValue === formattedFilter;
        }

        const stringValue = typeof value === 'string' ? value.toLowerCase() : String(value ?? '').toLowerCase();
        const filterString = typeof filterValue === 'string' ? filterValue.toLowerCase() : filterValue;

        const byColumn = !filterString || stringValue.includes(filterString);
        const byGlobal =
          !globalFilter ||
          this.columns.some((col) => String(item[col] ?? '').toLowerCase().includes(globalFilter));

        return byColumn && byGlobal;
      });

      // ReleaseStatus: uses lower-first release_Date
      const matchesReleaseStatus =
        releaseStatus === '' ||
        (releaseStatus === 'discharged' && !!item.release_Date) ||
        (releaseStatus === 'hospitalized' && !item.release_Date);

      return matchesColumns && matchesReleaseStatus;
    });

    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
    this.matTableDataSource.paginator = this.paginator;
    this.graphData = this.filteredData;
  }

  formatDate(date: Date): string {
    const d = new Date(date);
    const day = ('0' + d.getDate()).slice(-2);
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  resetFilters() {
    this.filterForm.reset();
    this.filterForm.get('globalFilter')?.setValue('');
    this.applyFilters();
  }

  // labels keyed by lower-first
  getColumnLabel(column: string): string {
    const columnLabels: Record<string, string> = {
      name: 'שם',
      id_Num: 'ת.ז.',
      admission_No: 'מספר אשפוז',
      first_Name: 'שם פרטי',
      last_Name: 'שם משפחה',
      age_Years: 'גיל',
      record_Date: 'תאריך קבלה',
      entry_Date: 'תאריך דיווח',
      pain: 'כאב',
      description_Text: 'תיאור',
      degree_Text: 'דרגה',
      location_Text: 'מיקום',
      made_In_Text: 'נוצר ב',
      support_Device_Text: 'התקן תמיכה',
      release_Date: 'תאריך שחרור'
    };
    return columnLabels[column] || column;
  }

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

  navigateToGraphPage() {
    this.showGraph = !this.showGraph;
  }

  goToHome() {
    this.router.navigate(['/MainPageReports']);
  }
}
