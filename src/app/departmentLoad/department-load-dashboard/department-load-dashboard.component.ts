import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, Subject } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { DepartmentDetailDialogComponent } from '../../departmentLoad/department-detail/department-detail.component';

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
  selector: 'app-department-load-dashboard',
  templateUrl: './department-load-dashboard.component.html',
  styleUrls: ['./department-load-dashboard.component.scss']
})
export class DepartmentLoadDashboardComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['departName', 'currentPatients', 'totalBeds', 'currentStaff', 'totalStaff', 'patientComplexity', 'totalLoad'];
  dataSource = new MatTableDataSource<DepartmentLoad>();
  gaugeValue: number = 0;
  totalPatients: number = 0;
  isHandset$: Observable<boolean>;
  loginUserName = '';
  selectedDepartments: string[] = [];
  private filterChangeSubject = new Subject<string>();

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private http: HttpClient,
    private breakpointObserver: BreakpointObserver,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset)
      .pipe(
        map((result: any) => result.matches),
        shareReplay()
      );

    this.filterChangeSubject.asObservable().subscribe(() => {
      this.updateGaugeValue();
    });
  }

  ngOnInit(): void {
    this.fetchData();

    this.dataSource.filterPredicate = (data: DepartmentLoad, filter: string) => {
      if (this.selectedDepartments.length === 0) {
        return true;
      }
      return this.selectedDepartments.includes(data.departName);
    };
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  fetchData(): void {
    this.http.get<DepartmentLoad[]>(`${environment.apiUrl}ChamelleonCurrentPatientsAPI/GetPatientCounts`)
      .subscribe(data => {
        const departments = data.map(department => ({
          ...department,
          totalLoad: this.calculateTotalLoad(department.currentPatients, department.totalBeds)
        }));
        this.dataSource.data = departments;
        this.updateGaugeValue();
      }, error => {
        console.error('Error fetching data', error);
      });
  }

  calculateTotalLoad(currentPatients: number, totalBeds: number): number {
    return totalBeds ? (currentPatients / totalBeds) * 100 : 0;
  }

  updateGaugeValue(): void {
    const filteredData = this.dataSource.filteredData;
    const totalCurrentPatients = filteredData.reduce((sum, department) => sum + department.currentPatients, 0);
    const totalBeds = filteredData.reduce((sum, department) => sum + department.totalBeds, 0);
    this.totalPatients = totalCurrentPatients;
    this.gaugeValue = totalBeds ? (totalCurrentPatients / totalBeds) * 100 : 0;
  }

  getTotalLoadClass(totalLoad: number): string {
    if (totalLoad > 100) {
      return 'total-load-red';
    } else if (totalLoad >= 80) {
      return 'total-load-yellow';
    } else {
      return 'total-load-green';
    }
  }

  getGaugeColor(totalLoad: number): string {
    if (totalLoad > 100) {
      return '#f44336'; // red
    } else if (totalLoad >= 80) {
      return '#ff9800'; // orange
    } else {
      return '#4caf50'; // green
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    this.filterChangeSubject.next(this.dataSource.filter);

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onDepartmentFilterChange(selectedDepartments: string[]): void {
    this.selectedDepartments = selectedDepartments;
    this.dataSource.filter = 'apply'; // Trigger the filter
    this.filterChangeSubject.next('');
  }



  onRowClicked(row: DepartmentLoad) {
    this.dialog.open(DepartmentDetailDialogComponent, {
      width: '400px',
      data: { id: row.id }
    });
  }
}
