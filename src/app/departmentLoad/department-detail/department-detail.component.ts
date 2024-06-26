import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface DepartmentLoad {
  id: number;
  departName: string;
  currentPatients: number;
  totalBeds: number;
  departType: string;
  departChameleonCode: string;
  currentStaff: number;
  totalStaff: number;
  patientComplexity: number;
  totalLoad?: number;
  onLifeSupport?: number;
  quarantineDef?: number;
  quarantineAirAndTouch?: number;
}

@Component({
  selector: 'app-department-detail-dialog',
  templateUrl: './department-detail.component.html',
  styleUrls: ['./department-detail.component.scss']
})
export class DepartmentDetailDialogComponent implements OnInit {
  department: DepartmentLoad | undefined;
  loginUserName = '';

  constructor(
    public dialogRef: MatDialogRef<DepartmentDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id: number },
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    document.title = ' פרטי מחלקה';
    this.loginUserName = localStorage.getItem('loginUserName') || '';
    this.http.get<DepartmentLoad>(`${environment.apiUrl}ChamelleonCurrentPatientsAPI/GetDepartmentById/${this.data.id}`)
      .subscribe(data => {
        this.department = data;
        console.log('Department details:', data); // Log to ensure data is correct
      });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
