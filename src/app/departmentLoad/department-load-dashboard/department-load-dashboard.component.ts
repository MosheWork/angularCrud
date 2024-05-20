import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';
import { DepartmentDetailDialogComponent } from '../../departmentLoad/department-detail/department-detail.component';

export interface DepartmentLoad {
  id: number;
  departName: string;
  currentPatients: number;
  totalBeds: number;
  departType: string;
  departChameleonCode: string;
  totalLoad?: number;
}

@Component({
  selector: 'app-department-load-dashboard',
  templateUrl: './department-load-dashboard.component.html',
  styleUrls: ['./department-load-dashboard.component.scss']
})
export class DepartmentLoadDashboardComponent implements OnInit {
  displayedColumns: string[] = ['departName', 'currentPatients', 'totalBeds', 'departType', 'departChameleonCode', 'totalLoad'];
  dataSource = new MatTableDataSource<DepartmentLoad>();
  isHandset$: Observable<boolean>;

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private http: HttpClient,
    private breakpointObserver: BreakpointObserver,
    private dialog: MatDialog
  ) {
    this.isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset)
      .pipe(
        map(result => result.matches),
        shareReplay()
      );
  }

  ngOnInit(): void {
    this.http.get<DepartmentLoad[]>(environment.apiUrl + 'ChamelleonCurrentPatientsAPI/GetPatientCounts')
      .subscribe(data => {
        const departments = data.map(department => ({
          ...department,
          totalLoad: this.calculateTotalLoad(department.currentPatients, department.totalBeds)
        }));
        this.dataSource.data = departments;
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
      });
  }

  calculateTotalLoad(currentPatients: number, totalBeds: number): number {
    return totalBeds ? (currentPatients / totalBeds) * 100 : 0;
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

  transformUnitType(unitType: string): string {
    if (unitType === 'h') {
      return 'אשפוז';
    } else if (unitType === 'v') {
      return 'מרפאה';
    }
    return unitType;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onRowClicked(row: DepartmentLoad) {
    this.dialog.open(DepartmentDetailDialogComponent, {
      width: '400px',
      data: { id: row.id }
    });
  }
}
