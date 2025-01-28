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

  physiotherapyStats: string = '';
  mobilityStats: string = '';
  walkingStats: string = '';
  
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
  unitOptions: string[] = []; // Stores unique UnitName options for the dropdown

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  filterForm: FormGroup;

  constructor(private http: HttpClient, private fb: FormBuilder, private router: Router) {
    this.filterForm = this.fb.group({
      globalFilter: [''],
      unitFilter: [''], // Filter control for UnitName
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.setupFilterListeners();
  }

  loadData(): void {
    this.http.get<any[]>(`${environment.apiUrl}DepartmentOccupiedMITAV`).subscribe(
      (data) => {
        this.dataSource = new MatTableDataSource(data);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.totalResults = data.length;
  
        // Extract unique UnitName values for the dropdown
        this.unitOptions = [...new Set(data.map((item) => item.UnitName))].sort();
  
        // Set up the filter predicate
        this.dataSource.filterPredicate = this.customFilterPredicate();
  
        // Update counts after loading data
        this.updateCounts(data);
      },
      (error) => {
        console.error('Error fetching data', error);
      }
    );
  }
  

  setupFilterListeners(): void {
    this.filterForm.get('globalFilter')?.valueChanges.subscribe(() => this.applyFilter());
    this.filterForm.get('unitFilter')?.valueChanges.subscribe(() => this.applyFilter());
  }

  applyFilter(): void {
    const globalFilterValue = this.filterForm.get('globalFilter')?.value?.trim().toLowerCase() || '';
    const unitFilterValue = this.filterForm.get('unitFilter')?.value || '';
  
    // Update the filter string with a combination of global and unit filters
    this.dataSource.filter = JSON.stringify({ global: globalFilterValue, unit: unitFilterValue });
  
    // Update counts based on filtered data
    this.updateCounts(this.dataSource.filteredData);
  }
  

  customFilterPredicate(): (data: any, filter: string) => boolean {
    return (data, filter) => {
      const filterObject = JSON.parse(filter);
      const globalFilter = filterObject.global;
      const unitFilter = filterObject.unit;

      const matchesGlobalFilter = !globalFilter || JSON.stringify(data).toLowerCase().includes(globalFilter);
      const matchesUnitFilter = !unitFilter || data.UnitName === unitFilter;

      return matchesGlobalFilter && matchesUnitFilter;
    };
  }

  resetFilters(): void {
    // Reset all filter controls
    this.filterForm.reset();
    this.filterForm.patchValue({
      globalFilter: '',
      unitFilter: '',
    });
  
    // Ensure the filterPredicate processes the reset
    this.applyFilter();
  
    // Update counts after resetting filters
    this.updateCounts(this.dataSource.filteredData);
  }
  

  getColumnLabel(column: string): string {
    return this.columnLabels[column] || column;
  }

  updateCounts(data: any[]): void {
    const total = this.totalResults;

    // Physiotherapy stats (count "כן")
    const physiotherapyYes = data.filter(item => item.PhysiotherapyConsultation === 'כן').length;
    this.physiotherapyStats = `התייעצות פיזיותרפיה: ${physiotherapyYes}/${total} (${((physiotherapyYes / total) * 100).toFixed(2)}%)`;
  
    // Mobility stats (exclude "אין תיעוד" from count)
    const mobilityValid = data.filter(item => item.MobilityAssessment !== 'אין תיעוד').length;
    this.mobilityStats = `הערכת ניידות: ${mobilityValid}/${total} (${((mobilityValid / total) * 100).toFixed(2)}%)`;
  
    // Walking prescription stats (count "כן")
    const walkingYes = data.filter(item => item.WalkingPrescription === 'כן').length;
    this.walkingStats = `מרשם להליכה: ${walkingYes}/${total} (${((walkingYes / total) * 100).toFixed(2)}%)`;
  }
  
  
  
}
