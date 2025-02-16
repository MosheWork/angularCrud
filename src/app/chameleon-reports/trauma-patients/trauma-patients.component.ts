import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';

import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { FormControl, FormGroup } from '@angular/forms';
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
    'TransferToOtherInstitution',  // ✅ Added missing TransferToOtherInstitution
    'Remarks',
    'Relevant'
 
  ];
  
  selectedPatient: any | null = null;
  dataSource = new MatTableDataSource<TraumaPatient>([]);
  editMode: { [key: string]: boolean } = {};
  editForms: { [key: string]: FormGroup  } = {};

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.fetchTraumaPatients();
  }

  fetchTraumaPatients() {
    this.http.get<any[]>(environment.apiUrl + 'Trauma/GetTraumaPatients').subscribe(
      (data) => {
        this.dataSource.data = data;

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
