import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import * as XLSX from 'xlsx';
import { DatePipe } from '@angular/common';

import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { environment } from '../../../environments/environment';

interface TraumaPatient {
  caseNumber: string;
  admissionDepartment: string;
  admissionTime: string;
  erReleaseTime: string;
  hospitalReleaseTime: string;
  ctTime: string | null;
  chestXRayTime: string | null;
  deathTime: string | null;
  surgeryTime: string | null;
  ultrasoundTechTime: string | null;
  shockRoom: string;
  patientName: string;
  departmentName: string;
  erDoctor: string;
  erNurse: string;
  receiveCause: string;
  receiveCauseDescription: string;
  remarks: string;
  relevant: number | null;
  month: number;
  week: number;
  year: number;
  transferToOtherInstitution: string;
  executionDetails: string;
  icdName?: string;
}

@Component({
  selector: 'app-trauma-patients',
  templateUrl: './trauma-patients.component.html',
  styleUrls: ['./trauma-patients.component.scss']
})
export class TraumaPatientsComponent implements OnInit {
  displayedColumns: string[] = [
    'relevantToggle',
    'remarks',
    'relevant',
    'caseNumber',
    'patientName',
    'admissionDepartment',
    'departmentName',
    'admissionTime',
    'erReleaseTime',
    'hospitalReleaseTime',
    'ctTime',
    'chestXRayTime',
    'deathTime',
    'surgeryTime',
    'ultrasoundTechTime',
    'shockRoom',
    'icdName',
    'month',
    'week',
    'year',
    'receiveCause',
    'receiveCauseDescription',
    'erDoctor',
    'erNurse',
    'transferToOtherInstitution',
    'executionDetails'
  ];

  isDateColumn(column: string): boolean {
    return [
      'admissionTime',
      'erReleaseTime',
      'hospitalReleaseTime',
      'ctTime',
      'chestXRayTime',
      'deathTime',
      'surgeryTime',
      'ultrasoundTechTime'
    ].includes(column);
  }

  // כותרות בעברית לפי המפתחות החדשים (camelCase)
  columnHeaders: { [key: string]: string } = {
    remarks: 'הערות',
    relevant: 'רלוונטי',
    caseNumber: 'מס מקרה',
    patientName: 'שם מטופל',
    admissionDepartment: 'מחלקה בקבלה',
    departmentName: 'מחלקה מאשפזת',
    shockRoom: 'חדר הלם',
    admissionTime: 'זמן קבלה',
    erReleaseTime: 'זמן שחרור ממיון',
    hospitalReleaseTime: 'זמן שחרור בית חולים',
    transferToOtherInstitution: 'העברה למוסד אחר',
    deathTime: 'זמן פטירה',
    ctTime: 'זמן CT',
    surgeryTime: 'זמן ניתוחים',
    icdName: 'תאור פעולה',
    year: 'שנה',
    month: 'חודש',
    week: 'שבוע',
    receiveCauseDescription: 'סיבת קבלה',
    erDoctor: 'רופא במיון',
    erNurse: 'אח/ות במיון',
    chestXRayTime: 'זמן צילום חזה',
    ultrasoundTechTime: 'זמן טכנאי אולטרסאונד',
    executionDetails: 'פרטי ביצוע'
  };

  filterForm: FormGroup;
  totalResults: number = 0;
  titleUnit: string = 'דוח טראומה';
  Title1: string = ' סה"כ תוצאות: ';
  Title2: string = '';
  originalData: TraumaPatient[] = []; // ✅ Store the original dataset
  isLoading:boolean=true;

  selectedPatient: any | null = null;
  dataSource = new MatTableDataSource<TraumaPatient>([]);
  editMode: { [key: string]: boolean } = {};
  editForms: { [key: string]: FormGroup  } = {};
  filteredData: any[] = [];

  // Unique filter options
  uniqueYears: number[] = [];
  uniqueMonths: number[] = [];
  uniqueWeeks: number[] = [];
  uniqueAdmissionDepartments: string[] = [];
  uniqueShockRooms: string[] = [];
  uniqueTransfers: string[] = [];
  uniqueReceiveCauses: string[] = [];
  TransferToOtherInstitution: string[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private datePipe: DatePipe

  ) {
    this.filterForm = this.createFilterForm();
  }
  ngOnInit(): void {
    this.fetchTraumaPatients();
  
    // ✅ Automatically apply filters when form changes
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }
  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
      this.dataSource.sort = this.sort;
    });
  }


  fetchTraumaPatients() {
    this.isLoading = true;

    this.http.get<TraumaPatient[]>(environment.apiUrl + 'Trauma/GetTraumaPatients').subscribe(
      (data) => {
        // הנתונים כבר ב-camelCase מה־backend
        this.originalData = [...data];
        this.filteredData = [...data];
        this.dataSource.data = this.filteredData;
        this.totalResults = data.length;

        // סט ערכים ייחודיים לפילטרים
        this.uniqueYears = [...new Set(data.map(i => i.year).filter(Boolean))].sort((a, b) => b - a);
        this.uniqueMonths = [...new Set(data.map(i => i.month).filter(Boolean))].sort((a, b) => b - a);
        this.uniqueWeeks = [...new Set(data.map(i => i.week).filter(Boolean))].sort((a, b) => b - a);
        this.uniqueAdmissionDepartments = [...new Set(data.map(i => i.admissionDepartment).filter(Boolean))].sort();
        this.uniqueShockRooms = [...new Set(data.map(i => i.shockRoom).filter(Boolean))].sort();
        this.uniqueTransfers = [...new Set(data.map(i => i.transferToOtherInstitution).filter(Boolean))].sort();
        this.uniqueReceiveCauses = [...new Set(data.map(i => i.receiveCauseDescription).filter(Boolean))].sort();

        // טפסי עריכה לשורות
        data.forEach(p => {
          this.editForms[p.caseNumber] = new FormGroup({
            CaseNumber: new FormControl(p.caseNumber), // נשאר PascalCase ל־POST
            Remarks: new FormControl(p.remarks),
            Relevant: new FormControl(p.relevant)
          });
        });

        this.isLoading = false;
        setTimeout(() => this.applyFilters(), 100);
      },
      (error) => {
        console.error('Error fetching trauma patients:', error);
        this.isLoading = false;
      }
    );
  }
  

  private createFilterForm(): FormGroup {
    return this.fb.group({
      globalFilter: new FormControl(''),
      relevantFilter: new FormControl(''),
      YearFilter: new FormControl([]),
      MonthFilter: new FormControl([]),
      WeekFilter: new FormControl([]),
      AdmissionDepartmentFilter: new FormControl([]),
      ShockRoomFilter: new FormControl([]),
      TransferFilter: new FormControl([]),
      ReceiveCauseDesFilter: new FormControl([])
    });
  }

  applyFilters() {
    const f = this.filterForm.value;
    const globalFilter = (f.globalFilter || '').toLowerCase();
    const relevantFilter = f.relevantFilter;

    const selectedYears = f.YearFilter || [];
    const selectedMonths = f.MonthFilter || [];
    const selectedWeeks = f.WeekFilter || [];
    const selectedAdmissionDepartments = f.AdmissionDepartmentFilter || [];
    const selectedShockRooms = f.ShockRoomFilter || [];
    const selectedTransfers = f.TransferFilter || [];
    const selectedReceiveCauses = f.ReceiveCauseDesFilter || [];

    this.filteredData = this.originalData.filter((item) => {
      const matchesGlobal = globalFilter
        ? Object.values(item as any).some(v => v && v.toString().toLowerCase().includes(globalFilter))
        : true;

      let matchesRelevant = true;
      if (relevantFilter === 'לא עודכן') matchesRelevant = item.relevant === null;
      else if (relevantFilter === '1') matchesRelevant = item.relevant === 1;
      else if (relevantFilter === '2') matchesRelevant = item.relevant === 2;

      const matchesYear = selectedYears.length ? selectedYears.includes(item.year) : true;
      const matchesMonth = selectedMonths.length ? selectedMonths.includes(item.month) : true;
      const matchesWeek = selectedWeeks.length ? selectedWeeks.includes(item.week) : true;
      const matchesAdmissionDepartment = selectedAdmissionDepartments.length ? selectedAdmissionDepartments.includes(item.admissionDepartment) : true;
      const matchesShockRoom = selectedShockRooms.length ? selectedShockRooms.includes(item.shockRoom) : true;
      const matchesTransfer = selectedTransfers.length ? selectedTransfers.includes(item.transferToOtherInstitution) : true;
      const matchesReceiveCause = selectedReceiveCauses.length ? selectedReceiveCauses.includes(item.receiveCauseDescription) : true;

      return matchesGlobal &&
             matchesRelevant &&
             matchesYear &&
             matchesMonth &&
             matchesWeek &&
             matchesAdmissionDepartment &&
             matchesShockRoom &&
             matchesTransfer &&
             matchesReceiveCause;
    });

    this.dataSource.data = this.filteredData;
    this.totalResults = this.filteredData.length;

    setTimeout(() => {
      if (this.paginator) {
        this.paginator.firstPage();
        this.dataSource.paginator = this.paginator;
      }
    });
  }

  resetFilters() {
    this.filterForm.reset({
      globalFilter: '',
      relevantFilter: '1',
      YearFilter: [],
      MonthFilter: [],
      WeekFilter: [],
      AdmissionDepartmentFilter: [],
      ShockRoomFilter: [],
      TransferFilter: [],
      ReceiveCauseDesFilter: []
    });

    this.filteredData = [...this.originalData];
    this.dataSource.data = this.filteredData;
    this.totalResults = this.filteredData.length;

    setTimeout(() => {
      if (this.paginator) {
        this.paginator.firstPage();
        this.dataSource.paginator = this.paginator;
      }
    });
  }

  
  

  exportToExcel() {
    if (!this.filteredData.length) {
      console.warn('No data available to export.');
      return;
    }

    const columnHeaders: { [key: string]: string } = this.columnHeaders;

    const formatted = this.filteredData.map(item => {
      const row: any = {};
      Object.keys(item).forEach((key) => {
        if (columnHeaders[key]) {
          row[columnHeaders[key]] = (item as any)[key];
        }
      });
      return row;
    });

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formatted);
    const wb: XLSX.WorkBook = { Sheets: { 'טראומה': ws }, SheetNames: ['טראומה'] };
    XLSX.writeFile(wb, 'טראומה.xlsx');
  }
  
  enableEdit(caseNumber: string): void {
    this.editMode[caseNumber] = true;
  }

  cancelEdit(caseNumber: string): void {
    this.editMode[caseNumber] = false;
  }

  saveEdit() {  // ✅ Fix: No parameter needed
    if (!this.selectedPatient) return;

    const updatedData = this.editForms[this.selectedPatient.CaseNumber].value;
    this.http.post(environment.apiUrl + 'Trauma/InsertTraumaRemark', updatedData).subscribe(
      () => {
        console.log('Update successful');
        this.fetchTraumaPatients(); // Refresh data
        this.closeDialog();
      },
      (error) => {
        console.error('Error updating trauma remark:', error);
      }
    );
  }

  getFormControl(caseNumber: string, field: string): FormControl {
    return this.editForms[caseNumber]?.get(field) as FormControl;
  }

  openDialog(patient: any) {
    this.selectedPatient = patient;
  }
  closeDialog() {
    this.selectedPatient = null;
  }
  isDefaultDate(value: any): boolean {
    const date = new Date(value);
    return date.getFullYear() === 1900;
  }

  onRelevantToggle(element: TraumaPatient, isChecked: boolean) {
    element.relevant = isChecked ? 1 : 0;

    // שומר ל־backend בפורמט PascalCase (כמו קודם)
    const updatedData = {
      CaseNumber: element.caseNumber,
      Relevant: element.relevant,
      Remarks: element.remarks || ''
    };

    this.http.post(environment.apiUrl + 'Trauma/InsertTraumaRemark', updatedData).subscribe(
      () => this.fetchTraumaPatients(),
      (error) => console.error('Error updating Relevant:', error)
    );
  }
  formatDialogValue(column: string, value: any): string {
    if (this.isDateColumn(column) && value && !this.isDefaultDate(value)) {
      return this.datePipe.transform(value, 'dd/MM/yyyy HH:mm') || '';
    }
    return value;
  }
}
