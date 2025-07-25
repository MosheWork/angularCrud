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
  CaseNumber: string;
  AdmissionDepartment: string;
  AdmissionTime: string;
  ERReleaseTime: string;
  HospitalReleaseTime: string;
  CTTime: string | null;
  ChestXRayTime: string | null;
  DeathTime: string | null;
  SurgeryTime: string | null;
  UltrasoundTechTime: string | null;
  ShockRoom: string;
  PatientName: string;
  DepartmentName: string;
  ERDoctor: string;
  ERNurse: string;
  ReceiveCause: string;
  ReceiveCauseDescription: string;
  Remarks: string;
  Relevant: number | null;
  Month: number;
  Week: number;
  Year: number;
  TransferToOtherInstitution: string; 

}

@Component({
  selector: 'app-trauma-patients',
  templateUrl: './trauma-patients.component.html',
  styleUrls: ['./trauma-patients.component.scss']
})
export class TraumaPatientsComponent implements OnInit {
  displayedColumns: string[] = [
    'RelevantToggle',
    'Remarks',
    'Relevant',
    'CaseNumber',
    'PatientName',
    'AdmissionDepartment',
    'DepartmentName',
    'AdmissionTime',
    'ERReleaseTime',
    'HospitalReleaseTime',
    'CTTime',
    'ChestXRayTime',
    'DeathTime',
    'SurgeryTime',
    'UltrasoundTechTime',
    'ShockRoom',
    'ICDName',  // ✅ Added missing ICDName
    'Month',  // ✅ Added missing Month
    'Week',  // ✅ Added missing Week
    'Year',  // ✅ Added missing Year

    'ReceiveCause',
    'ReceiveCauseDescription',
    'ERDoctor',
    'ERNurse',  // ✅ Added missing ERNurse
    'TransferToOtherInstitution' ,
    'ExecutionDetails'
     
    
 
  ];

  isDateColumn(column: string): boolean {
    return [
      'AdmissionTime',
      'ERReleaseTime',
      'HospitalReleaseTime',
      'CTTime',
      'ChestXRayTime',
      'DeathTime',
      'SurgeryTime',
      'UltrasoundTechTime'
    ].includes(column);
  }


  columnHeaders: { [key: string]: string } = {
    'Remarks': 'הערות',
    'Relevant': 'רלוונטי',
    'CaseNumber': 'מס מקרה',
    'PatientName': 'שם מטופל',
    'AdmissionDepartment': 'מחלקה בקבלה',
    'DepartmentName': 'מחלקה מאשפזת',
    'ShockRoom': 'חדר הלם',
    'AdmissionTime': 'זמן קבלה',
    'ERReleaseTime': 'זמן שחרור ממיון',
    'HospitalReleaseTime': 'זמן שחרור בית חולים',
    'TransferToOtherInstitution': 'העברה למוסד אחר',
    'DeathTime': 'זמן פטירה',
    'CTTime': 'זמן CT',
    'SurgeryTime': 'זמן ניתוחים',
    'ICDName': 'תאור פעולה',
    'Year': 'שנה',
    'Month': 'חודש',
    'Week': 'שבוע',
    
    'ReceiveCauseDescription': 'סיבת קבלה',
    'ERDoctor': 'רופא במיון',
    'ERNurse': 'אח/ות במיון',
    'ChestXRayTime': 'זמן צילום חזה',
    'UltrasoundTechTime': 'זמן טכנאי אולטרסאונד',
    'ExecutionDetails':'ExecutionDetails'
    
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
        this.originalData = [...data]; // ✅ Store the original data
        this.dataSource.data = data;
        this.filteredData = [...data];
        this.totalResults = data.length;
  // ✅ Set initial data into table
  this.dataSource.data = this.filteredData;
       // Extract unique values for filters
       this.uniqueYears = [...new Set(data.map(item => item.Year).filter(Boolean))].sort((a, b) => b - a);
       this.uniqueMonths = [...new Set(data.map(item => item.Month).filter(Boolean))].sort((a, b) => b - a);
       this.uniqueWeeks = [...new Set(data.map(item => item.Week).filter(Boolean))].sort((a, b) => b - a);
       this.uniqueAdmissionDepartments = [...new Set(data.map(item => item.AdmissionDepartment).filter(Boolean))].sort();
       this.uniqueShockRooms = [...new Set(data.map(item => item.ShockRoom).filter(Boolean))].sort();
       this.uniqueTransfers = [...new Set(data.map(item => item.TransferToOtherInstitution).filter(Boolean))].sort();
       this.uniqueReceiveCauses = [...new Set(data.map(item => item.ReceiveCauseDescription).filter(Boolean))].sort();
  // ✅ Apply initial filters automatically
  this.isLoading = false;

  setTimeout(() => this.applyFilters(), 100);
        // ✅ Initialize forms for each row
        data.forEach(patient => {
          this.editForms[patient.CaseNumber] = new FormGroup({
            CaseNumber: new FormControl(patient.CaseNumber),
            Remarks: new FormControl(patient.Remarks),
            Relevant: new FormControl(patient.Relevant)
          });
        });
      },
      (error) => {
        console.error('Error fetching trauma patients:', error);
      }
    );
  }
  

  private createFilterForm(): FormGroup {
    return this.fb.group({
      globalFilter: new FormControl(''),
      relevantFilter: new FormControl(''), // ✅ Default value is "לא עודכן"
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
    const filters = this.filterForm.value;
    const globalFilter = (filters.globalFilter || '').toLowerCase();
    const relevantFilter = filters.relevantFilter;
    
    const selectedYears = filters.YearFilter || [];
    const selectedMonths = filters.MonthFilter || [];
    const selectedWeeks = filters.WeekFilter || [];
    const selectedAdmissionDepartments = filters.AdmissionDepartmentFilter || [];
    const selectedShockRooms = filters.ShockRoomFilter || [];
    const selectedTransfers = filters.TransferFilter || [];
    const selectedReceiveCauses = filters.ReceiveCauseDesFilter || [];
  
    this.filteredData = this.originalData.filter((item: TraumaPatient) => {
      const matchesGlobalFilter = globalFilter
        ? Object.values(item).some((val) => val && val.toString().toLowerCase().includes(globalFilter))
        : true;
  
      let matchesRelevantFilter = true;
      if (relevantFilter === "לא עודכן") {
        matchesRelevantFilter = item.Relevant === null;
      } else if (relevantFilter === "1") {
        matchesRelevantFilter = item.Relevant === 1;
      } else if (relevantFilter === "2") {
        matchesRelevantFilter = item.Relevant === 2;
      } else if (relevantFilter === "") {
        matchesRelevantFilter = true;
      }
  
      const matchesYear = selectedYears.length ? selectedYears.includes(item.Year) : true;
      const matchesMonth = selectedMonths.length ? selectedMonths.includes(item.Month) : true;
      const matchesWeek = selectedWeeks.length ? selectedWeeks.includes(item.Week) : true;
      const matchesAdmissionDepartment = selectedAdmissionDepartments.length ? selectedAdmissionDepartments.includes(item.AdmissionDepartment) : true;
      const matchesShockRoom = selectedShockRooms.length ? selectedShockRooms.includes(item.ShockRoom) : true;
      const matchesTransfer = selectedTransfers.length ? selectedTransfers.includes(item.TransferToOtherInstitution) : true;
      const matchesReceiveCause = selectedReceiveCauses.length ? selectedReceiveCauses.includes(item.ReceiveCauseDescription) : true;
  
      return matchesGlobalFilter &&
             matchesRelevantFilter &&
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
  
    // ✅ Hebrew column headers mapping
    const columnHeaders: { [key: string]: string } = {
      CaseNumber: 'מס מקרה',
      PatientName: 'שם מטופל',
      AdmissionDepartment: 'מחלקה בקבלה',
      ShockRoom: 'חדר הלם',
      AdmissionTime: 'זמן קבלה',
      ERReleaseTime: 'זמן שחרור ממיון',
      HospitalReleaseTime: 'זמן שחרור בית חולים',
      TransferToOtherInstitution: 'העברה למוסד אחר',
      DeathTime: 'זמן פטירה',
      CTTime: 'זמן CT',
      SurgeryTime: 'זמן ניתוחים',
      ReceiveCauseDescription: 'ReceiveCauseDes(סיבת קבלה)',
      Year: 'שנה',
      Month: 'חודש',
      Week: 'שבוע',
      DepartmentName: 'מחלקה מאשפזת',
      ReceiveCause: 'תאור פעולה',
      ERDoctor: 'רופא במיון',
      ERNurse: 'אח/ות במיון',
      ChestXRayTime: 'זמן צילום חזה',
      UltrasoundTechTime: 'זמן טכנאי אולטרסאונד',
      Remarks: 'הערות',
      Relevant: 'רלוונטי'
    };
  
    // ✅ Format data with Hebrew headers
    const formattedData = this.filteredData.map(item => {
      let newItem: any = {};
      Object.keys(item).forEach(key => {
        if (columnHeaders[key]) {
          newItem[columnHeaders[key]] = item[key]; // ✅ Assign Hebrew names
        }
      });
      return newItem;
    });
  
    // ✅ Convert to Excel sheet
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook: XLSX.WorkBook = { Sheets: { 'טראומה': worksheet }, SheetNames: ['טראומה'] };
    
    // ✅ Export as Excel file
    XLSX.writeFile(workbook, 'טראומה.xlsx');
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

  onRelevantToggle(element: any, isChecked: boolean) {
    // Update the local value
    element.Relevant = isChecked ? 1 : 0;
  
    // Create the same payload your dialog uses
    const updatedData = {
      CaseNumber: element.CaseNumber,
      Relevant: element.Relevant,
      Remarks: element.Remarks || ''  // or pull from element if needed
    };
  
    // Call backend same as saveEdit()
    this.http.post(environment.apiUrl + 'Trauma/InsertTraumaRemark', updatedData).subscribe(
      () => {
        console.log('Relevant updated successfully');
        this.fetchTraumaPatients(); // Refresh
      },
      (error) => {
        console.error('Error updating Relevant:', error);
      }
    );
  }
  formatDialogValue(column: string, value: any): string {
    if (this.isDateColumn(column) && value && !this.isDefaultDate(value)) {
      return this.datePipe.transform(value, 'dd/MM/yyyy HH:mm') || '';
    }
    return value;
  }
  
}
