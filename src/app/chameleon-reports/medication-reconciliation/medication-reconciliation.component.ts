import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { FormBuilder, FormGroup } from '@angular/forms';


export interface MedicationReconciliationModel {
  Admission_No: string;
  Admission_Date: string;
  UnitName: string;
  ComboText_15536: string;
  ComboText_15537: string;
  Consiliums: string;

  // 🆕 Add these for tracking entry users
  UserName_15536: string;
  UserName_15537: string;
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
  stillHospitalizedDataSource = new MatTableDataSource<MedicationReconciliationModel>();

  isLoading = true;
  departments: string[] = []; // will populate after data loads
  filterForm: FormGroup;
  tabIndex = 0;

  originalData: MedicationReconciliationModel[] = [];
  originalStillInHospitalData: MedicationReconciliationModel[] = [];

  @ViewChild('globalSearchInput') globalSearchInput!: any;

  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild('sort') sort!: MatSort;
  
  // 🆕 For second table
  @ViewChild('stillPaginator') stillPaginator!: MatPaginator;
  @ViewChild('stillSort') stillSort!: MatSort;
  
  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      department: [''],
      startDate: [null],
      endDate: [null]
    });
  }
  ngOnInit(): void {
    this.loadDischargedData();
    this.loadStillHospitalizedData();
  }

  loadDischargedData(): void {
    this.http.get<MedicationReconciliationModel[]>(`${environment.apiUrl}/MedicationReconciliation`)
      .subscribe({
        next: data => {
          this.originalData = data;
          this.dataSource.data = data;
          this.departments = [...new Set(data.map(row => row.UnitName).filter(Boolean))];
          this.isLoading = false;
          setTimeout(() => {
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
          });

          this.filterForm.valueChanges.subscribe(() => this.applyFormFilter());
        },
        error: err => {
          console.error('❌ Failed to load discharged data:', err);
          this.isLoading = false;
        }
      });
  }

  loadStillHospitalizedData(): void {
    this.http.get<MedicationReconciliationModel[]>(`${environment.apiUrl}/MedicationReconciliation/StilinHospital`)
      .subscribe({
        next: data => {
          this.originalStillInHospitalData = data;
          this.stillHospitalizedDataSource.data = data;
          setTimeout(() => {
            this.stillHospitalizedDataSource.paginator = this.stillPaginator;
            this.stillHospitalizedDataSource.sort = this.stillSort;
          });
        },
        error: err => {
          console.error('❌ Failed to load still hospitalized data:', err);
        }
      });
  }
  applyGlobalFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
  }

  applyFormFilter(): void {
    const { department, startDate, endDate } = this.filterForm.value;
    const filtered = this.originalData.filter(row => {
      const matchesDept = !department || row.UnitName === department;
      const date = new Date(row.Admission_Date);
      const matchesStart = !startDate || date >= new Date(startDate);
      const matchesEnd = !endDate || date <= new Date(endDate);
      return matchesDept && matchesStart && matchesEnd;
    });

    this.dataSource.data = filtered;
    setTimeout(() => this.dataSource.paginator = this.paginator);
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.dataSource.filter = '';
    this.dataSource.data = this.originalData;
    if (this.globalSearchInput) {
      this.globalSearchInput.nativeElement.value = '';
    }
    setTimeout(() => this.dataSource.paginator = this.paginator);
  }
}
