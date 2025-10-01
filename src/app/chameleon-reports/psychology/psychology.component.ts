import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { environment } from '../../../environments/environment';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-psychology',
  templateUrl: './psychology.component.html',
  styleUrls: ['./psychology.component.scss']
})
export class PsychologyComponent implements OnInit {
  loading = false;

  filterForm: FormGroup;
  availableYears: number[] = [2023, 2024, 2025];
  months = [
    { name: 'ינואר', value: 1 }, { name: 'פברואר', value: 2 }, { name: 'מרץ', value: 3 },
    { name: 'אפריל', value: 4 }, { name: 'מאי', value: 5 }, { name: 'יוני', value: 6 },
    { name: 'יולי', value: 7 }, { name: 'אוגוסט', value: 8 }, { name: 'ספטמבר', value: 9 },
    { name: 'אוקטובר', value: 10 }, { name: 'נובמבר', value: 11 }, { name: 'דצמבר', value: 12 }
  ];

  anamnesisResultsDataSource = new MatTableDataSource<any>([]);
  fullListDataSource = new MatTableDataSource<any>([]);

  // SUMMARY columns (match /api/Psychology/Summary payload)
  anamnesisResultsColumns: string[] = [
    'userCode', 'userName',
    'interviewIntake',
    'diagnosisAssessment',
    'individualTherapy',
    'coupleTherapy',
    'familyOrDyadicTherapy',
    'parentsGuidance',
    'meetingWithCareGivers',
    'groupTherapy',
    'infoGatheringUpdateCall',
    'opinionOrTreatmentSummaryWriting',
    'peersConsultationForPlan',
    'total'
  ];

  // DETAILED columns (match /api/Psychology/Detailed payload)
  fullListColumns: string[] = [
    'admission_No',
    'id_Num',
    'first_Name',
    'last_Name',
    'userName',
    'entry_Date',
    'description'
  ];

  // Display maps
  columnDisplayNames2: Record<string, string> = {
    userCode: 'קוד משתמש',
    userName: 'שם משתמש',
    interviewIntake: 'ראיון אינטייק',
    diagnosisAssessment: 'מפגש אבחון והערכה',
    individualTherapy: 'טיפול פרטני',
    coupleTherapy: 'טיפול זוגי',
    familyOrDyadicTherapy: 'טיפול משפחתי/ טיפול דיאדי',
    parentsGuidance: 'הדרכת הורים',
    meetingWithCareGivers: 'מפגש עם גורמים טיפוליים',
    groupTherapy: 'טיפול קבוצתי',
    infoGatheringUpdateCall: 'שיחת איסוף מידע ועדכון',
    opinionOrTreatmentSummaryWriting: 'כתיבת חוות דעת / סיכום טיפול',
    peersConsultationForPlan: 'התייעצות עמיתים לצורך בניית תכנית טיפולית',
    total: 'סה״כ'
  };

  columnDisplayNames: Record<string, string> = {
    admission_No: 'מספר מקרה',
    id_Num: 'מספר זהות',
    first_Name: 'שם פרטי',
    last_Name: 'שם משפחה',
    userName: 'שם המטפל',
    entry_Date: 'תאריך',
    description: 'סוג מפגש'
  };

  @ViewChild('anamnesisResultsPaginator') anamnesisResultsPaginator!: MatPaginator;
  @ViewChild('fullListPaginator') fullListPaginator!: MatPaginator;

  @ViewChild('anamnesisResultsSort') anamnesisResultsSort!: MatSort;
  @ViewChild('fullListSort') fullListSort!: MatSort;

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      year: new FormControl(new Date().getFullYear()),
      month: new FormControl(null)
    });
  }

  ngOnInit(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    const { year, month } = this.filterForm.value;
    this.fetchSummary(year, month);
    this.fetchDetailed(year, month);
  }

  resetFilters(): void {
    this.filterForm.reset({ year: new Date().getFullYear(), month: null });
    this.applyFilters();
  }

  private fetchSummary(year?: number, month?: number): void {
    this.loading = true;
    const params: any = {};
    if (year) params.year = year;
    if (month) params.month = month;

    this.http.get<any[]>(`${environment.apiUrl}Psychology/Summary`, { params })
      .subscribe(data => {
        this.anamnesisResultsDataSource.data = data || [];

        setTimeout(() => {
          this.anamnesisResultsDataSource.paginator = this.anamnesisResultsPaginator;
          this.anamnesisResultsDataSource.sort = this.anamnesisResultsSort;
        });

        this.loading = false;
      }, _ => this.loading = false);
  }

  private fetchDetailed(year?: number, month?: number): void {
    this.loading = true;
    const params: any = {};
    if (year) params.year = year;
    if (month) params.month = month;

    this.http.get<any[]>(`${environment.apiUrl}Psychology/Detailed`, { params })
      .subscribe(data => {
        this.fullListDataSource.data = data || [];

        setTimeout(() => {
          this.fullListDataSource.paginator = this.fullListPaginator;
          this.fullListDataSource.sort = this.fullListSort;
        });

        this.loading = false;
      }, _ => this.loading = false);
  }

  exportAnamnesisResultsToExcel(): void {
    this.exportToExcel(this.anamnesisResultsDataSource, 'Psychology_Summary.xlsx');
  }

  exportFullListToExcel(): void {
    this.exportToExcel(this.fullListDataSource, 'Psychology_Details.xlsx');
  }

  private exportToExcel(ds: MatTableDataSource<any>, fileName: string): void {
    const data = ds.data || [];

    const displayMap: Record<string, string> = {
      ...this.columnDisplayNames2,
      ...this.columnDisplayNames
    };

    const rows = data.map(row => {
      const out: any = {};
      Object.keys(row).forEach(k => out[displayMap[k] || k] = row[k]);
      return out;
    });

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(rows);
    (ws as any)['!dir'] = 'rtl';
    const wb: XLSX.WorkBook = { Sheets: { 'נתונים': ws }, SheetNames: ['נתונים'] };
    XLSX.writeFile(wb, fileName);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.anamnesisResultsPaginator) this.anamnesisResultsDataSource.paginator = this.anamnesisResultsPaginator;
      if (this.anamnesisResultsSort)      this.anamnesisResultsDataSource.sort      = this.anamnesisResultsSort;

      if (this.fullListPaginator) this.fullListDataSource.paginator = this.fullListPaginator;
      if (this.fullListSort)      this.fullListDataSource.sort      = this.fullListSort;
    });
  }
}
