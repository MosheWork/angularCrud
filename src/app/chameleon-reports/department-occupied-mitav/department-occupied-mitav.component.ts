import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-department-occupied-mitav',
  templateUrl: './department-occupied-mitav.component.html',
  styleUrls: ['./department-occupied-mitav.component.scss'],
})
export class DepartmentOccupiedMitavComponent implements OnInit {
  Title1: string = '  ';
  Title2: string = 'סה"כ מטופלים: ';
  titleUnit: string = 'תפוסת מחלקה לדוח מיתב ';
  totalResults: number = 0;

  displayedColumns: string[] = ['PName', 'UnitName', 'Room', 'BedName', 'Age', 'PhysiotherapyConsultation', 'MobilityAssessment', 'WalkingPrescription'];
  columnLabels: { [key: string]: string } = {
    PName: 'שם המטופל',
    UnitName: 'שם המחלקה',
    Room: 'חדר',
    BedName: 'מיטה',
    Age: 'גיל',
    PhysiotherapyConsultation: 'התייעצות פיזיותרפיה',
    MobilityAssessment: 'הערכת ניידות',
    WalkingPrescription: 'מרשם להליכה',
  };

  dataSource: MatTableDataSource<any> = new MatTableDataSource();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  filterForm: FormGroup;

  constructor(private http: HttpClient, private fb: FormBuilder, private router: Router) {
    this.filterForm = this.fb.group({
      globalFilter: [''],
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.filterForm.get('globalFilter')?.valueChanges.subscribe(() => this.applyFilter());
  }

  loadData(): void {
    this.http.get<any[]>(`${environment.apiUrl}DepartmentOccupiedMITAV`).subscribe(
      (data) => {
        this.dataSource = new MatTableDataSource(data);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.totalResults = data.length;
      },
      (error) => {
        console.error('Error fetching data', error);
      }
    );
  }

  applyFilter(): void {
    const filterValue = this.filterForm.get('globalFilter')?.value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.dataSource.filter = '';
  }

  getColumnLabel(column: string): string {
    return this.columnLabels[column] || column;
  }

  goToHome(): void {
    this.router.navigate(['/MainPageReports']);
  }
}
