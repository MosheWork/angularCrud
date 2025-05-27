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

  ngOnInit(): void {
    this.dataSource.filterPredicate = (data, filter) => {
      const filters = JSON.parse(filter);
      const deptMatch = !filters.departments.length || filters.departments.includes(data.DepartmentHebFullDesc?.trim());
      const textMatch = !filters.text || Object.values(data).some(val =>
        val?.toString().toLowerCase().includes(filters.text)
      );
      const surveyMatch = filters.survey === 'הכל' || data.SurveyDescription === filters.survey;
    
      const statusMatch = filters.status === ''
        ? !data.CaseManagerStatus || data.CaseManagerStatus.trim() === ''
        : data.CaseManagerStatus?.trim() === filters.status;
    
      const yearMatch = !filters.years.length || filters.years.includes(data.VYear);
      const monthMatch = !filters.months.length || filters.months.includes(data.VMonth);
    
      return deptMatch && textMatch && surveyMatch && statusMatch && yearMatch && monthMatch;
    };
    
    this.fetchData();
  }
  fetchData(): void {
    this.isLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}ServiceCRM/QuestionnaireRemarksBI`).subscribe(data => {
      this.dataSource.data = data;
      
      this.departments = [...new Set(data.map(d => d.DepartmentHebFullDesc).filter(Boolean))].sort();
      this.surveyDescriptions = ['הכל', ...new Set(data.map(d => d.SurveyDescription).filter(Boolean))];
      this.caseManagerStatuses = ['', ...new Set(data.map(d => d.CaseManagerStatus?.trim()).filter(Boolean))];
  
      // ✅ New: Populate unique years and months
      this.uniqueYears = [...new Set(data.map(d => d.VYear).filter(Boolean))].sort((a, b) => b - a);
      this.uniqueMonths = [...new Set(data.map(d => d.VMonth).filter(Boolean))].sort((a, b) => a - b);
  
      this.isLoading = false;
  
      setTimeout(() => {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.applyFilter();
      });
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
    const dialogRef = this.dialog.open(QuestionnaireRemarksPhoneCallDialogComponent, {
      width: '600px',
      data: row
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const payload = {
          ...result,
          CaseNumber: row.CaseNumber
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
  
    // Clear text search manually (optional if user typed something)
    const inputElement = document.querySelector('input[matInput]') as HTMLInputElement;
    if (inputElement) {
      inputElement.value = '';
    }
  
    this.applyFilter();
  }
  exportToExcelOnlyRowsWithRemarks(): void {
    const rowsWithRemarks = this.dataSource.filteredData.filter(
      row => row.CaseManagerRemarks && row.CaseManagerRemarks.trim() !== ''
    );
  
    if (rowsWithRemarks.length === 0) {
      alert('אין שורות עם הערות מנהל מקרה לייצוא.');
      return;
    }
  
    const exportData = rowsWithRemarks.map(row => ({
      'מספר מקרה': row.CaseNumber,
      'שם מטופל': row.PatientName,
      'תאריך': row.RemarkDate,
      'מחלקה': row.DepartmentHebFullDesc,
      'הערות מנהל מקרה': row.CaseManagerRemarks,
      'סטטוס': row.CaseManagerStatus,
      'קטגוריה': row.CaseManagerCategory,
      ' טלפון': row.CellNumber2
     
    }));
  
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'הערות מנהל מקרה': worksheet },
      SheetNames: ['הערות מנהל מקרה']
    };
  
    XLSX.writeFile(workbook, 'CaseManagerRemarks.xlsx');
  }
  
    
  
}
