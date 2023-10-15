import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { EmployeeService } from '../services/employee.service';
import { CoreService } from '../core/core.service';
import { EmpAddEditComponent } from '../emp-add-edit/emp-add-edit.component';

@Component({
  selector: 'app-hos-list',
  templateUrl: './hos-list.component.html',
  styleUrls: ['./hos-list.component.scss'],
})
export class HosListComponent {
  displayedColumns: string[] = [
    // must be small letter on start to get  from back end
    'departName',
    'totalHos',
   

    //'profile_Code'
  ];
  dataSource!: MatTableDataSource<any>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private _dialog: MatDialog,
    private _empService: EmployeeService,
    private _coreService: CoreService
  ) {}
  ngOnInit(): void {
    this.getHosList();
  }
  openAddEditEmpForm() {
    const DialogRef = this._dialog.open(EmpAddEditComponent);
    DialogRef.afterClosed().subscribe({
      next: (val) => {
        if (val) {
          this.getHosList();
        }
      },
    });
  }

  getHosList() {
    this._empService.getHosList().subscribe({
      next: (res) => {
        this.dataSource = new MatTableDataSource(res);
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
      },
      error: console.log,
    });
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  // deleteEmplyee(id: number) {
  //   this._empService.deleteEmplyee(id).subscribe({
  //     next: (res) => {
  //       this._coreService.openSnackBar('emplyee deleted', 'done');
  //       this.getUnitsList();
  //     },
  //     error: console.log,
  //   });
  // }
}
