import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import * as XLSX from 'xlsx';

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
}

@Component({
  selector: 'app-trauma-patients',
  templateUrl: './trauma-patients.component.html',
  styleUrls: ['./trauma-patients.component.scss']
})
export class TraumaPatientsComponent implements OnInit {
  displayedColumns: string[] = [
    'Remarks',
    'Relevant',
    'CaseNumber',
    'PatientName',
    'AdmissionDepartment',
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
    'DepartmentName',
    'ReceiveCause',
    'ReceiveCauseDescription',
    'ERDoctor',
    'ERNurse',  // ✅ Added missing ERNurse
    'TransferToOtherInstitution'  // ✅ Added missing TransferToOtherInstitution
    
 
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
    'DepartmentName': 'מחלקה מאשפזת',
    'ReceiveCauseDescription': 'סיבת קבלה',
    'ERDoctor': 'רופא במיון',
    'ERNurse': 'אח/ות במיון',
    'ChestXRayTime': 'זמן צילום חזה',
    'UltrasoundTechTime': 'זמן טכנאי אולטרסאונד'
    
};

  filterForm: FormGroup;
  totalResults: number = 0;
  titleUnit: string = 'דוח טראומה';
  Title1: string = ' סה"כ תוצאות: ';
  Title2: string = '';
  originalData: TraumaPatient[] = []; // ✅ Store the original dataset

  selectedPatient: any | null = null;
  dataSource = new MatTableDataSource<TraumaPatient>([]);
  editMode: { [key: string]: boolean } = {};
  editForms: { [key: string]: FormGroup  } = {};
  filteredData: any[] = [];

  

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private dialog: MatDialog
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
    this.http.get<TraumaPatient[]>(environment.apiUrl + 'Trauma/GetTraumaPatients').subscribe(
      (data) => {
        this.originalData = [...data]; // ✅ Store the original data
        this.dataSource.data = data;
        this.filteredData = [...data];
        this.totalResults = data.length;
  // ✅ Set initial data into table
  this.dataSource.data = this.filteredData;
      
  // ✅ Apply initial filters automatically
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
      relevantFilter: new FormControl(1) // ✅ Default filter to 1 (Yes)
    });
  }
  applyFilters() {
    const filters = this.filterForm.value;
    const globalFilter = (filters.globalFilter || '').toLowerCase();
    const relevantFilter = filters.relevantFilter;
  
    // ✅ Always filter from the original dataset
    this.filteredData = this.originalData.filter((item: TraumaPatient) => {
      const matchesGlobalFilter = globalFilter
        ? Object.values(item).some((val) =>
            val && val.toString().toLowerCase().includes(globalFilter)
          )
        : true;
       
        const matchesRelevantFilter =
        relevantFilter === '' || relevantFilter === null ||
        (relevantFilter == 1 && item.Relevant == 1) ||
        (relevantFilter == 0 && item.Relevant == 0);
  
      return matchesGlobalFilter && matchesRelevantFilter;
    });
  
    // ✅ Update data source properly
    this.dataSource.data = this.filteredData;
    this.totalResults = this.filteredData.length;
  
    // ✅ Update paginator
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
      relevantFilter: 1 // ✅ Ensure it resets to default value '1'
    });
  
    setTimeout(() => {
      this.filteredData = [...this.originalData]; // ✅ Restore original data
      this.dataSource.data = this.filteredData;
      this.totalResults = this.filteredData.length;
  
      if (this.paginator) {
        this.paginator.firstPage();
        this.dataSource.paginator = this.paginator;
      }
    });
  
    this.applyFilters(); // ✅ Ensures table refreshes with new filters
  }
  
  

  exportToExcel() {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filteredData);
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
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
  
}
