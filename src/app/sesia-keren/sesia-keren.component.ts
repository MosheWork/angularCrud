import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormBuilder } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import {SesiaKerenCommentDialogComponent} from './sesia-keren-comment-dialog/sesia-keren-comment-dialog.component'

import * as XLSX from 'xlsx';
import { environment } from '../../environments/environment';

interface Row {
  caseNumber: string | null;
  patientName: string | null;
  surgeryDate: string | null;
  hDayOfWeek: string | null;
  timeRoomEnter: string | null;
  timeRoomExit: string | null;
  keren: string | null;
  drg: string | null;
  surgery_NAME: string | null;
  department: string | null;
  icd9: string | null;
  surgeryLangth: string | null;
  invoiceTotalAmount: number | null;
  surgeryRunk: string | null;
  mainSurgeonNameFirst1: string | null;
  mainSurgeonNameLast1: string | null;
  mainSurgeonNameFirst2: string | null;
  mainSurgeonNameLast2: string | null;
  secretaryDRG: string | null;
  nurseScrub: string | null;
  nurseScrubEnter: string | null;
  nurseScrubExit: string | null;
  nurseCirculating: string | null;
  nurseCirculatingEnter: string | null;
  nurseCirculatingExit: string | null;
  nurseRecovery: string | null;
  nurseRecoveryEnter: string | null;
  nurseRecoveryExit: string | null;
  anesthesiologist: string | null;
  anesthesiologistEnter: string | null;
  anesthesiologistExit: string | null;
  technician: string | null;
  technicianEnter: string | null;
  technicianExit: string | null;
  pumpist: string | null;
  pumpistEnter: string | null;
  pumpistExit: string | null;
  ssia: string | null;
  nurseScrubID: string | null;
  nurseCirculatingID: string | null;
  nurseRecoveryID: string | null;
  technicianID: string | null;
  pumpistID: string | null;
  comment: string | null;

}

@Component({
  selector: 'app-sesia-keren',
  templateUrl: './sesia-keren.component.html',
  styleUrls: ['./sesia-keren.component.scss']
})
export class SesiaKerenComponent implements OnInit {

  showGraph = false;
  Title1: string = ' ניתוחי חדר ניתוח  - ';
  Title2: string = 'סה"כ תוצאות ';
  titleUnit: string = 'Sesia Keren ';
  totalResults: number = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  filterForm: FormGroup;
  graphData: Row[] = [];

  dataSource: Row[] = [];
  filteredData: Row[] = [];

  matTableDataSource: MatTableDataSource<Row>;

  // רק העמודות שביקשת
  columns: string[] = [
    'caseNumber',
    'patientName',
    'surgeryDate',
    'hDayOfWeek',
    'timeRoomEnter',
    'timeRoomExit',
    'keren',
    'drg',
    'surgery_NAME',
    'department',
    'icd9',
    'surgeryLangth',
    'invoiceTotalAmount',
    'surgeryRunk',
    'mainSurgeonNameFirst1',
    'mainSurgeonNameLast1',
    'mainSurgeonNameFirst2',
    'mainSurgeonNameLast2',
    'secretaryDRG',
    'nurseScrub',
    'nurseScrubEnter',
    'nurseScrubExit',
    'nurseCirculating',
    'nurseCirculatingEnter',
    'nurseCirculatingExit',
    'nurseRecovery',
    'nurseRecoveryEnter',
    'nurseRecoveryExit',
    'anesthesiologist',
    'anesthesiologistEnter',
    'anesthesiologistExit',
    'technician',
    'technicianEnter',
    'technicianExit',
    'pumpist',
    'pumpistEnter',
    'pumpistExit',
    'ssia',
    'nurseScrubID',
    'nurseCirculatingID',
    'nurseRecoveryID',
    'technicianID',
    'pumpistID',
    'comment'

  ];

  // options for קרן multi-select
  kerenOptions: string[] = [];

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private router: Router,
    private dialog: MatDialog 
  ) {
    this.filterForm = this.fb.group({
      fromDate: [null],
      toDate: [null],
      kerenFilter: [[]]
    });

    this.matTableDataSource = new MatTableDataSource<Row>([]);
  }

  ngOnInit() {
    this.loadData();

    // טווח תאריך + קרן – כל שינוי מפעיל פילטר
    this.filterForm.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged())
      .subscribe(() => this.applyFilters());
  }

  // ====== BACKEND CALL ======
  loadData() {
    this.http.get<any[]>(environment.apiUrl + 'SesiaKeren/GetAll')
      .subscribe((data) => {
        const normalized: Row[] = data.map(d => ({
          caseNumber:      d.caseNumber      ?? d.CaseNumber      ?? null,
          patientName:     d.patientName     ?? d.PatientName     ?? null,
          surgeryDate:     d.surgeryDate     ?? d.SurgeryDate     ?? null,
          hDayOfWeek:      d.hDayOfWeek      ?? d.HDayOfWeek      ?? null,
          timeRoomEnter:   d.timeRoomEnter   ?? d.TIME_ROOM_ENTER ?? null,
          timeRoomExit:    d.timeRoomExit    ?? d.TIME_ROOM_EXIT  ?? null,
          keren:           d.keren           ?? d.Keren           ?? null,
          drg:             d.drg             ?? d.DRG             ?? null,
          surgery_NAME:    d.surgery_NAME    ?? d.SURGERY_NAME    ?? null,
          department:      d.department      ?? d.Department      ?? null,
          icd9:            d.icd9            ?? d.ICD9            ?? d.Icd9 ?? null,
          surgeryLangth:   d.surgeryLangth   ?? d.SurgeryLangth   ?? null,
          invoiceTotalAmount: d.invoiceTotalAmount ?? d.InvoiceTotalAmount ?? null,
          surgeryRunk:     d.surgeryRunk     ?? d.SurgeryRunk     ?? null,
          mainSurgeonNameFirst1: d.mainSurgeonNameFirst1 ?? d.MainSurgeonNameFirst1 ?? null,
          mainSurgeonNameLast1:  d.mainSurgeonNameLast1  ?? d.MainSurgeonNameLast1  ?? null,
          mainSurgeonNameFirst2: d.mainSurgeonNameFirst2 ?? d.MainSurgeonNameFirst2 ?? null,
          mainSurgeonNameLast2:  d.mainSurgeonNameLast2  ?? d.MainSurgeonNameLast2  ?? null,
          secretaryDRG:    d.secretaryDRG    ?? d.SecretaryDRG    ?? null,
          nurseScrub:      d.nurseScrub      ?? d.NurseScrub      ?? null,
          nurseScrubEnter: d.nurseScrubEnter ?? d.NurseScrubEnter ?? null,
          nurseScrubExit:  d.nurseScrubExit  ?? d.NurseScrubExit  ?? null,
          nurseCirculating:      d.nurseCirculating      ?? d.NurseCirculating      ?? null,
          nurseCirculatingEnter: d.nurseCirculatingEnter ?? d.NurseCirculatingEnter ?? null,
          nurseCirculatingExit:  d.nurseCirculatingExit  ?? d.NurseCirculatingExit  ?? null,
          nurseRecovery:      d.nurseRecovery      ?? d.NurseRecovery      ?? null,
          nurseRecoveryEnter: d.nurseRecoveryEnter ?? d.NurseRecoveryEnter ?? null,
          nurseRecoveryExit:  d.nurseRecoveryExit  ?? d.NurseRecoveryExit  ?? null,
          anesthesiologist:      d.anesthesiologist      ?? d.Anesthesiologist      ?? null,
          anesthesiologistEnter: d.anesthesiologistEnter ?? d.AnesthesiologistEnter ?? null,
          anesthesiologistExit:  d.anesthesiologistExit  ?? d.AnesthesiologistExit  ?? null,
          technician:      d.technician      ?? d.Technician      ?? null,
          technicianEnter: d.technicianEnter ?? d.TechnicianEnter ?? null,
          technicianExit:  d.technicianExit  ?? d.TechnicianExit  ?? null,
          pumpist:      d.pumpist      ?? d.Pumpist      ?? null,
          pumpistEnter: d.pumpistEnter ?? d.PumpistEnter ?? null,
          pumpistExit:  d.pumpistExit  ?? d.PumpistExit  ?? null,
          ssia:         d.ssia         ?? d.SSIA         ?? null,
          nurseScrubID:        d.nurseScrubID        ?? d.NurseScrubID        ?? null,
          nurseCirculatingID:  d.nurseCirculatingID  ?? d.NurseCirculatingID  ?? null,
          nurseRecoveryID:     d.nurseRecoveryID     ?? d.NurseRecoveryID     ?? null,
          technicianID:        d.technicianID        ?? d.TechnicianID        ?? null,
          pumpistID:           d.pumpistID           ?? d.PumpistID           ?? null,
          comment: d.comment ?? d.Comment ?? null

        }));

        this.dataSource = normalized;
        this.filteredData = [...normalized];

        // fill קרן options
        const ks = new Set<string>();
        this.dataSource.forEach(r => {
          const k = (r.keren ?? '').trim();
          if (k) ks.add(k);
        });
        this.kerenOptions = Array.from(ks).sort();

        this.matTableDataSource = new MatTableDataSource<Row>(this.filteredData);
        this.matTableDataSource.paginator = this.paginator;
        this.matTableDataSource.sort = this.sort;

        this.totalResults = this.filteredData.length;
        this.graphData = this.filteredData;
      });
  }

  // ====== LABELS ======
  getColumnLabel(column: string): string {
    const columnLabels: Record<string, string> = {
      caseNumber: 'מספר מקרה',
      patientName: 'שם מטופל',
      surgeryDate: 'תאריך ניתוח',
      hDayOfWeek: 'יום בשבוע',
      timeRoomEnter: 'כניסה לחדר ניתוח',
      timeRoomExit: 'יציאה מחדר ניתוח',
      keren: 'קרן',
      drg: 'DRG',
      surgery_NAME: 'שם ניתוח',
      department: 'מחלקה',
      icd9: 'ICD9',
      surgeryLangth: 'משך ניתוח',
      invoiceTotalAmount: 'סכום חשבונית',
      surgeryRunk: 'דחיפות / דירוג ניתוח',
      mainSurgeonNameFirst1: 'שם פרטי מנתח 1',
      mainSurgeonNameLast1: 'שם משפחה מנתח 1',
      mainSurgeonNameFirst2: 'שם פרטי מנתח 2',
      mainSurgeonNameLast2: 'שם משפחה מנתח 2',
      secretaryDRG: 'DRG מזכירות',
      nurseScrub: 'אח/ות מעבירה',
      nurseScrubEnter: 'כניסת אח/ות מעבירה',
      nurseScrubExit: 'יציאת אח/ות מעבירה',
      nurseCirculating: 'אח/ות מסתובבת',
      nurseCirculatingEnter: 'כניסת אח/ות מסתובבת',
      nurseCirculatingExit: 'יציאת אח/ות מסתובבת',
      nurseRecovery: 'אח/ות התאוששות',
      nurseRecoveryEnter: 'כניסת אח/ות התאוששות',
      nurseRecoveryExit: 'יציאת אח/ות התאוששות',
      anesthesiologist: 'מרדים/ה',
      anesthesiologistEnter: 'כניסת מרדים/ה',
      anesthesiologistExit: 'יציאת מרדים/ה',
      technician: 'טכנאי/ת',
      technicianEnter: 'כניסת טכנאי/ת',
      technicianExit: 'יציאת טכנאי/ת',
      pumpist: 'פמפיסט/ית',
      pumpistEnter: 'כניסת פמפיסט/ית',
      pumpistExit: 'יציאת פמפיסט/ית',
      ssia: 'SSIA',
      nurseScrubID: 'ת"ז אח/ות מעבירה',
      nurseCirculatingID: 'ת"ז אח/ות מסתובבת',
      nurseRecoveryID: 'ת"ז אח/ות התאוששות',
      technicianID: 'ת"ז טכנאי/ת',
      pumpistID: 'ת"ז פמפיסט/ית',
      comment: 'הערה כללית'  

    };
    return columnLabels[column] || column;
  }

  // ====== FILTERING (date range + keren) ======
  applyFilters() {
    const { fromDate, toDate, kerenFilter } = this.filterForm.value;

    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    if (to) {
      to.setHours(23, 59, 59, 999); // inclusive
    }

    this.filteredData = this.dataSource.filter((item) => {
      // filter by surgeryDate
      let d: Date | null = null;
      if (item.surgeryDate) {
        d = new Date(item.surgeryDate);
        if (isNaN(d.getTime())) {
          d = null;
        }
      }

      if (from && (!d || d < from)) return false;
      if (to && (!d || d > to)) return false;

      // filter by Keren (multi-select)
      if (kerenFilter && Array.isArray(kerenFilter) && kerenFilter.length > 0) {
        const k = (item.keren ?? '').trim();
        if (!k || !kerenFilter.includes(k)) return false;
      }

      return true;
    });

    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
    this.matTableDataSource.paginator = this.paginator;
    this.graphData = this.filteredData;
  }

  resetFilters() {
    this.filterForm.reset({
      fromDate: null,
      toDate: null,
      kerenFilter: []
    });

    this.filteredData = [...this.dataSource];
    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
    this.matTableDataSource.paginator = this.paginator;
    this.graphData = this.filteredData;
  }

  // ====== EXCEL ======
  exportToExcel() {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filteredData);
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
    link.download = 'SesiaKeren.xlsx';
    link.click();
  }


  navigateToGraphPage() {
    this.showGraph = !this.showGraph;
  }
  
  onRowClick(row: Row) {
    if (!row.caseNumber) {
      return;
    }
  
    const dialogRef = this.dialog.open(SesiaKerenCommentDialogComponent, {
      width: '600px',
      direction: 'rtl',
      data: {
        caseNumber: row.caseNumber,
        patientName: row.patientName,
        surgeryDate: row.surgeryDate,
        comment: row.comment
      }
    });
  
    dialogRef.afterClosed().subscribe((result: { comment: string } | undefined) => {
      if (!result) return;
  
      this.saveComment(row, result.comment);
    });
  }
  
  private saveComment(row: Row, newComment: string) {
    if (!row.caseNumber) return;
  
    const payload = {
      caseNumber: row.caseNumber,
      comment: newComment,
      // plug your login user here if you have AuthenticationService:
      // entryUser: this.authService.loginUserName
      entryUser: null
    };
  
    this.http.post(environment.apiUrl + 'SesiaKeren/SaveComment', payload)
      .subscribe({
        next: () => {
          // update UI
          row.comment = newComment;
          this.matTableDataSource.data = [...this.filteredData];
        },
        error: err => {
          console.error('SaveComment failed', err);
          // you can show a snackbar/toast here if you want
        }
      });
  }
  
}
