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
import { EditDepartmentDialogComponent } from '../edit-department-dialog/edit-department-dialog.component';
export interface DepartmentLoad {
  id: number;
  departName: string;
  patientCount: number;
  totalBeds: number;
  currentStaff: number;
  totalStaff: number;
  patientComplexity: number;
  totalLoad?: number;
}

@Component({
  selector: 'app-department-load-by-shift',
  templateUrl: './department-load-by-shift.component.html',
  styleUrls: ['./department-load-by-shift.component.scss']
})
export class DepartmentLoadByShiftComponent implements OnInit {

  displayedColumns: string[] = ['departName', 'patientCount', 'totalBeds', 'currentStaff', 'totalStaff', 'patientComplexity', 'totalLoad', 'actions'];
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
      const matchFilter = [];
      const filterArray = filter.split('$');
  
      const searchTerm = filterArray[0];
      const selectedDepartments = filterArray[1] ? filterArray[1].split(',') : [];
  
      // Apply search filter
      const customFilter = data.departName.toLowerCase().includes(searchTerm);
  
      // Apply department filter
      if (selectedDepartments.length > 0) {
        const departmentFilter = selectedDepartments.includes(data.departName);
        matchFilter.push(customFilter && departmentFilter);
      } else {
        matchFilter.push(customFilter);
      }
  
      return matchFilter.every(Boolean);
    };
  }
  
  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  fetchData(): void {
    this.http.get<DepartmentLoad[]>(`${environment.apiUrl}ChamelleonCurrentPatientsAPI/GetPatientCount`)
      .subscribe(data => {
        const departments = data.map(department => ({
          ...department,
          totalLoad: this.calculateTotalLoad(department.patientCount, department.totalBeds)
        }));
        this.dataSource.data = departments;
        this.updateGaugeValue();
      }, error => {
        console.error('Error fetching data', error);
      });
  }

  calculateTotalLoad(patientCount: number, totalBeds: number): number {
    return totalBeds > 0 ? (patientCount / totalBeds) * 100 : 0;
  }

  updateGaugeValue(): void {
    const filteredData = this.dataSource.filteredData;
    const totalCurrentPatients = filteredData.reduce((sum, department) => sum + department.patientCount, 0);
    const totalBeds = filteredData.reduce((sum, department) => sum + department.totalBeds, 0);
    this.totalPatients = totalCurrentPatients;
    this.gaugeValue = totalBeds > 0 ? (totalCurrentPatients / totalBeds) * 100 : 0;
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
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.updateFilter(filterValue, this.selectedDepartments);
  }
  
  onDepartmentFilterChange(selectedDepartments: string[]): void {
    this.selectedDepartments = selectedDepartments;
    this.updateFilter(this.dataSource.filter.split('$')[0], selectedDepartments);
  }
  
  updateFilter(searchTerm: string, selectedDepartments: string[]): void {
    const filterValue = `${searchTerm}$${selectedDepartments.join(',')}`;
    this.dataSource.filter = filterValue;
    this.filterChangeSubject.next(filterValue);
  
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  
  resetFilters(): void {
    this.selectedDepartments = [];
    this.dataSource.filter = '';
    this.filterChangeSubject.next('');
    this.applyFilter({ target: { value: '' } } as any);
  }
  
  openMoreInfo(row: DepartmentLoad) {
    this.dialog.open(DepartmentDetailDialogComponent, {
      width: '400px',
      data: { id: row.id }
    });
  }

  openEditDialog(row: DepartmentLoad) {
    const dialogRef = this.dialog.open(EditDepartmentDialogComponent, {
      width: '400px',
      data: { ...row }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Handle the result here (e.g., update the table with the new data)
        const index = this.dataSource.data.findIndex(item => item.id === result.id);
        if (index !== -1) {
          this.dataSource.data[index] = result;
          this.dataSource.data = [...this.dataSource.data]; // Refresh the data source
        }
      }
    });
  }

}
