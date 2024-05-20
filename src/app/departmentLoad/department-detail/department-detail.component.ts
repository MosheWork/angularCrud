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
}

@Component({
  selector: 'app-department-detail-dialog',
  templateUrl: './department-detail.component.html',
  styleUrls: ['./department-detail.component.scss']
})
export class DepartmentDetailDialogComponent implements OnInit {
  department: DepartmentLoad | undefined;

  constructor(
    public dialogRef: MatDialogRef<DepartmentDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id: number },
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.http.get<DepartmentLoad>(`${environment.apiUrl}ChamelleonCurrentPatientsAPI/GetDepartmentById/${this.data.id}`)
      .subscribe(data => {
        this.department = data;
      });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
