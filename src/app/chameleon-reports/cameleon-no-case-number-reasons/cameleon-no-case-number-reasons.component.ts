import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
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

  // 🔽 lowerCamelCase column ids
  columns: string[] = [
    'id',
    'idNum',
    'reasonForNoCaseNumber',
    'comments',
    'admissionNo',
    'unitName',
    'firstName',
    'lastName',
    'recordDate',
    'medicalRecord',
    'employeePhone',
    'emplyeeName'
  ];

  // 🔽 headers map keyed by lowerCamelCase columns
  columnHeaders: { [key: string]: string } = {
    id: 'מספר מזהה',
    idNum: 'תעודת זהות',
    reasonForNoCaseNumber: 'סיבת היעדר מספר מקרה',
    comments: 'הערות',
    admissionNo: 'מספר אישפוז',
    unitName: 'יחידה',
    firstName: 'שם פרטי',
    lastName: 'שם משפחה',
    recordDate: 'תאריך רישום',
    medicalRecord: 'רשומה רפואית',
    employeePhone: 'טלפון ',
    emplyeeName: ' שם העובד'
  };

  dialogData: any;

  dataSource: any[] = [];
  filteredData: any[] = [];
  matTableDataSource: MatTableDataSource<any>;
  loading: boolean = true;

  // Gauges
  totalRows: number = 0;
  updatedRows: number = 0;
  gaugeValue: number = 0;
  gaugeLabel: string = 'עודכן מתוך סה"כ';
  gaugeMax: number = 100;

  gaugeType = 'arch';
  gaugeSize = 200;
  gaugeThick = 12;
  gaugeForegroundColor = '#3f51b5';
  gaugeBackgroundColor = '#e0e0e0';

  filterForm: FormGroup;
  dialogForm: FormGroup;

  reasonList: string[] = [
    '',
    'המשתמש לא מוצא מטופל עקב סינון יומן ומבקש לקלוט מחדש',
    'זימון למספר יומנים, פתיחת מקרה באחד מהם',
    'זימון ליחידה מאשפזת (פעולה פולשנית)',
    'הוספת מטופל ידנית בלחיצה על כפתור',
    'אחר',
    'רישום מוקדם',
    'קבלת מטופל לפני זמן הזימון '
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('dialogTemplate') dialogTemplate!: TemplateRef<any>;

  constructor(private http: HttpClient, private fb: FormBuilder, public dialog: MatDialog) {
    this.filterForm = this.createFilterForm();
    this.dialogForm = this.createDialogForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
  }

  // ---------- Utils to normalize keys ----------
  private lowerFirst = (s: string) => (s && s.length ? s[0].toLowerCase() + s.slice(1) : s);

  private normalizeKeysShallow<T extends Record<string, any>>(obj: T): any {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
    const out: any = {};
    Object.keys(obj).forEach(k => {
      out[this.lowerFirst(k)] = obj[k];
    });
    return out;
  }

  private normalizeArrayKeys(arr: any[]): any[] {
    return (arr || []).map(item => (typeof item === 'object' ? this.normalizeKeysShallow(item) : item));
  }
  // --------------------------------------------

  ngOnInit() {
    this.loading = true;

    this.http.get<any[]>(environment.apiUrl + 'CameleonNoCaseNumberReasonsMM').subscribe({
      next: (data) => {
        // Convert PascalCase backend -> lowerCamelCase UI
        const normalized = this.normalizeArrayKeys(data);

        this.dataSource = normalized;
        this.filteredData = [...normalized];
        this.matTableDataSource = new MatTableDataSource(this.filteredData);

        setTimeout(() => {
          this.matTableDataSource.paginator = this.paginator;
          this.matTableDataSource.sort = this.sort;
        });

        this.loading = false;

        // Gauge stats based on lowerCamelCase keys
        this.totalRows = normalized.length;
        this.updatedRows = normalized.filter(row => row.reasonForNoCaseNumber && String(row.reasonForNoCaseNumber).trim() !== '').length;
        this.gaugeValue = this.totalRows ? Math.round((this.updatedRows / this.totalRows) * 100) : 0;
      },
      error: (error) => {
        console.error('Error fetching data:', error);
        this.loading = false;
      }
    });
  }

  private createFilterForm(): FormGroup {
    return this.fb.group({
      startEntryDate: new FormControl(null),
      endEntryDate: new FormControl(null),
      globalFilter: new FormControl('')
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

    // Use the same lowerCamelCase keys for export mapping
    const headers = this.columnHeaders;

    const formattedData = this.filteredData.map(item => {
      const row: any = {};
      // keep ordering by the columns array
      this.columns.forEach(colKey => {
        if (headers[colKey]) {
          const v = item[colKey];
          row[headers[colKey]] = colKey === 'recordDate' ? this.formatDate(v) : v;
        }
      });
      return row;
    });

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook: XLSX.WorkBook = { Sheets: { 'מטופלים ללא מספר מקרה': worksheet }, SheetNames: ['מטופלים ללא מספר מקרה'] };

    XLSX.writeFile(workbook, 'מטופלים_ללא_מספר_מקרה.xlsx');
  }

  private formatDate(dateString: string): string {
    if (!dateString) return 'אין תיעוד';
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  openDialog(data: any) {
    // data keys are lowerCamelCase now
    this.dialogData = data;

    this.dialogForm.patchValue({
      ReasonForNoCaseNumber: data?.reasonForNoCaseNumber || '',
      Comments: data?.comments || ''
    });

    this.dialog.open(this.dialogTemplate, {
      width: '1200px',
      maxWidth: '90vw',
      height: 'auto',
      panelClass: 'custom-dialog-container'
    });
  }

  closeDialog(): void {
    this.dialog.closeAll();
  }

  // Keep function signature simple; pass lowerCamelCase values from template
  submitReason(idNum: string, recordDate: string) {
    if (!this.dialogForm.valid) return;

    // 🔁 Backend expects PascalCase -> send PascalCase payload
    const requestData = {
      IdNum: idNum,
      RecordDate: recordDate,
      ReasonForNoCaseNumber: this.dialogForm.value.ReasonForNoCaseNumber,
      Comments: this.dialogForm.value.Comments
    };

    const requestUrl = environment.apiUrl + `CameleonNoCaseNumberReasonsMM/save`;

    this.http.post(requestUrl, requestData, {
      headers: { 'Content-Type': 'application/json' }
    }).subscribe({
      next: (response) => {
        console.log('Data submitted successfully:', response);
        this.dialog.closeAll();

        // Update local table which uses lowerCamelCase keys
        const existingRecord = this.dataSource.find(record =>
          (record.idNum ?? record.IdNum) === idNum &&
          (record.recordDate ?? record.RecordDate) === recordDate
        );

        if (existingRecord) {
          existingRecord.reasonForNoCaseNumber = requestData.ReasonForNoCaseNumber;
          existingRecord.comments = requestData.Comments;
        } else {
          this.dataSource.push({
            idNum,
            recordDate,
            reasonForNoCaseNumber: requestData.ReasonForNoCaseNumber,
            comments: requestData.Comments
          });
        }

        this.matTableDataSource.data = [...this.dataSource];

        // recalc gauges
        this.totalRows = this.dataSource.length;
        this.updatedRows = this.dataSource.filter(r => r.reasonForNoCaseNumber && String(r.reasonForNoCaseNumber).trim() !== '').length;
        this.gaugeValue = this.totalRows ? Math.round((this.updatedRows / this.totalRows) * 100) : 0;
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
    const globalFilter = filters.globalFilter ? String(filters.globalFilter).toLowerCase() : '';

    this.filteredData = this.dataSource.filter((item) => {
      const rd = item.recordDate ?? item.RecordDate;
      const recordDate = rd ? new Date(rd).setHours(0, 0, 0, 0) : null;

      const isWithinDateRange =
        (!startDate || (recordDate && recordDate >= startDate)) &&
        (!endDate || (recordDate && recordDate <= endDate));

      const matchesGlobalFilter =
        !globalFilter ||
        Object.values(item).some(v => (v ?? '').toString().toLowerCase().includes(globalFilter));

      return isWithinDateRange && matchesGlobalFilter;
    });

    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
  }
}
