import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';
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
    'CellNumber',
    'RemarkDate',
    'PatientName',
    'DepartmentHebFullDesc',
    'VisitDate',
    'Remark',
    'CaseManagerStatus',
    'CaseManagerCategory',
    'CaseManagerRemarks',
    'ManagerRemarks',
    'EntryDate'
  ];
  
  dataSource = new MatTableDataSource<any>([]);
  isLoading = true;
  selectedDepartments: string[] = [];
  departments: string[] = [];

  selectedSurveyDescription: string = 'הכל';
  selectedStatus: string = '';
  surveyDescriptions: string[] = [];
  caseManagerStatuses: string[] = [];

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
    
      const statusMatch =
      filters.status === ''
        ? !data.CaseManagerStatus || data.CaseManagerStatus.trim() === ''
        : data.CaseManagerStatus?.trim() === filters.status;
    
      return deptMatch && textMatch && surveyMatch && statusMatch;
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
      status: this.selectedStatus
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
}
