import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';
import * as XLSX from 'xlsx';

// You can create this edit dialog
import { QuestionnaireRemarksPhoneCallDialogComponent } from '../questionnaire-remarks-phone-call-dialog/questionnaire-remarks-phone-call-dialog.component';

@Component({
  selector: 'app-questionnaire-remarks',
  templateUrl: './questionnaire-remarks.component.html',
  styleUrls: ['./questionnaire-remarks.component.scss']
})
export class QuestionnaireRemarksComponent implements OnInit, AfterViewInit {
  // If your template uses these keys, consider switching it to the lowerCamel list below.
  // For now we keep this array (it won't be used by code logic).
  displayedColumns: string[] = [
    'SurveyDescription',
    'CaseNumber',
    'CellNumber2',
    'RemarkDate',
    'PatientName',
    'DepartmentHebFullDesc',
    'VisitDate',
    'Remark',
    'CaseManagerStatus',
    'CaseManagerCategory',
    'CaseManagerRemarks',
    'ManagerRemarks',
    'EntryDate',
    'UserName'
  ];

  // Preferred (lowerCamel) column ids for new templates:
  // surveyDescription, caseNumber, cellNumber2, remarkDate, patientName, departmentHebFullDesc,
  // visitDate, remark, caseManagerStatus, caseManagerCategory, caseManagerRemarks,
  // managerRemarks, entryDate, userName.
  // Keep using whatever your HTML expects; rows will contain BOTH namings.

  dataSource = new MatTableDataSource<any>([]);
  isLoading = true;

  selectedDepartments: string[] = [];
  departments: string[] = [];

  selectedSurveyDescription: string = 'הכל';
  selectedStatus: string = '';
  surveyDescriptions: string[] = [];
  caseManagerStatuses: string[] = [];

  selectedYears: number[] = [];
  selectedMonths: number[] = [];
  uniqueYears: number[] = [];
  uniqueMonths: number[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private dialog: MatDialog) {}

  // ---- Normalization helpers (lowerCamel + PascalCase mirror) ----
  private normalizeRow = (r: any) => {
    const n = {
      surveyDescription: r?.surveyDescription ?? r?.SurveyDescription ?? null,
      caseNumber: r?.caseNumber ?? r?.CaseNumber ?? null,
      cellNumber2: r?.cellNumber2 ?? r?.CellNumber2 ?? null,
      remarkDate: r?.remarkDate ?? r?.RemarkDate ?? null,
      patientName: r?.patientName ?? r?.PatientName ?? null,
      departmentHebFullDesc: r?.departmentHebFullDesc ?? r?.DepartmentHebFullDesc ?? null,
      visitDate: r?.visitDate ?? r?.VisitDate ?? null,
      remark: r?.remark ?? r?.Remark ?? null,
      caseManagerStatus: r?.caseManagerStatus ?? r?.CaseManagerStatus ?? '',
      caseManagerCategory: r?.caseManagerCategory ?? r?.CaseManagerCategory ?? '',
      caseManagerRemarks: r?.caseManagerRemarks ?? r?.CaseManagerRemarks ?? '',
      managerRemarks: r?.managerRemarks ?? r?.ManagerRemarks ?? '',
      entryDate: r?.entryDate ?? r?.EntryDate ?? null,
      userName: r?.userName ?? r?.UserName ?? null,
      vYear: r?.vYear ?? r?.VYear ?? null,
      vMonth: r?.vMonth ?? r?.VMonth ?? null
    };

    // Keep PascalCase mirrors for backward compatibility with existing templates
    return {
      ...n,
      SurveyDescription: n.surveyDescription,
      CaseNumber: n.caseNumber,
      CellNumber2: n.cellNumber2,
      RemarkDate: n.remarkDate,
      PatientName: n.patientName,
      DepartmentHebFullDesc: n.departmentHebFullDesc,
      VisitDate: n.visitDate,
      Remark: n.remark,
      CaseManagerStatus: n.caseManagerStatus,
      CaseManagerCategory: n.caseManagerCategory,
      CaseManagerRemarks: n.caseManagerRemarks,
      ManagerRemarks: n.managerRemarks,
      EntryDate: n.entryDate,
      UserName: n.userName,
      VYear: n.vYear,
      VMonth: n.vMonth
    };
  };

  private normalizeAll = (rows: any[]) => rows.map(this.normalizeRow);

  ngOnInit(): void {
    // Filter works against normalized (lowerCamel) fields
    this.dataSource.filterPredicate = (data, filter) => {
      const f = JSON.parse(filter || '{}');

      const deptMatch =
        !f.departments?.length ||
        f.departments.includes(data.departmentHebFullDesc?.trim());

      const textMatch =
        !f.text ||
        Object.values(data).some((val: any) =>
          (val ?? '').toString().toLowerCase().includes(f.text)
        );

      const surveyMatch =
        f.survey === 'הכל' || data.surveyDescription === f.survey;

      const statusMatch =
        f.status === ''
          ? !data.caseManagerStatus || data.caseManagerStatus.trim() === ''
          : (data.caseManagerStatus ?? '').trim() === f.status;

      const yearMatch = !f.years?.length || f.years.includes(data.vYear);
      const monthMatch = !f.months?.length || f.months.includes(data.vMonth);

      return deptMatch && textMatch && surveyMatch && statusMatch && yearMatch && monthMatch;
    };

    this.fetchData();
  }

  fetchData(): void {
    this.isLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}ServiceCRM/QuestionnaireRemarksBI`).subscribe({
      next: (data) => {
        const normalized = this.normalizeAll(data);

        this.dataSource.data = normalized;

        // Distinct lists from normalized fields
        this.departments = [...new Set(normalized.map(d => d.departmentHebFullDesc).filter(Boolean))].sort();
        this.surveyDescriptions = ['הכל', ...new Set(normalized.map(d => d.surveyDescription).filter(Boolean))];
        this.caseManagerStatuses = ['', ...new Set(normalized.map(d => (d.caseManagerStatus ?? '').trim()).filter(Boolean))];

        this.uniqueYears = [...new Set(normalized.map(d => d.vYear).filter(Boolean))].sort((a, b) => b - a);
        this.uniqueMonths = [...new Set(normalized.map(d => d.vMonth).filter(Boolean))].sort((a, b) => a - b);

        this.isLoading = false;

        setTimeout(() => {
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          this.applyFilter();
        });
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  applyFilter(event?: Event): void {
    const text = event ? (event.target as HTMLInputElement).value.trim().toLowerCase() : '';

    this.dataSource.filter = JSON.stringify({
      text,
      departments: this.selectedDepartments,
      survey: this.selectedSurveyDescription,
      status: this.selectedStatus,
      years: this.selectedYears,
      months: this.selectedMonths
    });

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onDepartmentsChange(): void {
    this.applyFilter();
  }
  onFiltersChange(): void {
    this.applyFilter();
  }

  openEditDialog(row: any): void {
    // row already carries both lowerCamel + PascalCase
    const dialogRef = this.dialog.open(QuestionnaireRemarksPhoneCallDialogComponent, {
      width: '600px',
      data: row
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Always include both casings for safety
        const caseNumber = row.caseNumber ?? row.CaseNumber;

        const payload = {
          ...result,
          caseNumber,
          CaseNumber: caseNumber
        };

        this.http.post(`${environment.apiUrl}ServiceCRM/UpdateQuestionnaireRemark`, payload).subscribe(
          () => this.fetchData(),
          error => console.error('❌ Failed to update questionnaire remark:', error)
        );
      }
    });
  }

  resetFilters(): void {
    this.selectedDepartments = [];
    this.selectedSurveyDescription = 'הכל';
    this.selectedStatus = '';
    this.selectedYears = [];
    this.selectedMonths = [];

    // Clear text search (if present)
    const inputElement = document.querySelector('input[matInput]') as HTMLInputElement | null;
    if (inputElement) inputElement.value = '';

    this.applyFilter();
  }

  exportToExcelOnlyRowsWithRemarks(): void {
    const rowsWithRemarks = (this.dataSource.filteredData || []).filter(
      (row: any) => row.caseManagerRemarks && row.caseManagerRemarks.trim() !== ''
    );

    if (rowsWithRemarks.length === 0) {
      alert('אין שורות עם הערות מנהל מקרה לייצוא.');
      return;
    }

    const exportData = rowsWithRemarks.map((row: any) => ({
      'מספר מקרה': row.caseNumber,
      'שם מטופל': row.patientName,
      'תאריך': row.remarkDate,
      'מחלקה': row.departmentHebFullDesc,
      'הערות מנהל מקרה': row.caseManagerRemarks,
      'סטטוס': row.caseManagerStatus,
      'קטגוריה': row.caseManagerCategory,
      ' טלפון': row.cellNumber2,
      ' הערה': row.remark
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'הערות מנהל מקרה': worksheet },
      SheetNames: ['הערות מנהל מקרה']
    };

    XLSX.writeFile(workbook, 'CaseManagerRemarks.xlsx');
  }
}
