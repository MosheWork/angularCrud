import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface MedicationReconciliationModel {
  Admission_No: string;
  Admission_Date: string;
  UnitName: string;
  ComboText_15536: string;
  ComboText_15537: string;
 
  Consiliums: string;
}

@Component({
  selector: 'app-medication-reconciliation',
  templateUrl: './medication-reconciliation.component.html',
  styleUrls: ['./medication-reconciliation.component.scss']
})
export class MedicationReconciliationComponent implements OnInit {
  displayedColumns: string[] = [
    'Admission_No',
    'Admission_Date',
    'UnitName',
    'ComboText_15536',
    'ComboText_15537',
   
    'Consiliums'
  ];
  dataSource = new MatTableDataSource<MedicationReconciliationModel>();
  isLoading = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<MedicationReconciliationModel[]>(`${environment.apiUrl}/MedicationReconciliation`)
      .subscribe({
        next: data => {
          this.dataSource.data = data;
          this.isLoading = false;
          setTimeout(() => {
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
          });
        },
        error: err => {
          console.error('❌ Failed to load data:', err);
          this.isLoading = false;
        }
      });
  }
}
