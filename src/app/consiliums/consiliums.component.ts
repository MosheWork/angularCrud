import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { EmployeeService } from '../services/employee.service';
import { CoreService } from '../core/core.service';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { HttpClient } from
 
'@angular/common/http';

@Component({
  selector: 'app-consiliums',
  templateUrl: './consiliums.component.html',
  styleUrls: ['./consiliums.component.scss'],
})
export class ConsiliumsComponent  implements OnInit{
  displayedColumns: string[] = [
    // must be small letter on start to get  from back end
    'name',
    'id',
    'first_Name',
    'last_Name',
    'question',
    'time',
    'consiliumsUnit',
    //'profile_Code'
  ];

  // dataSource!: MatTableDataSource<any>;
  //dataSource = new MatTableDataSource<any>();
  dataSource = new MatTableDataSource<any>([]);
filterValues = {};

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private _dialog: MatDialog,
    private _empService: EmployeeService,
    private _coreService: CoreService,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    this.getConsiliums();
  }

  getConsiliums() {
    this._empService.getConsiliums().subscribe({
      next: (res) => {
        this.dataSource = new MatTableDataSource(res);
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
      },
      error: console.log,
    });
  }


  applyFilter(event: Event): void {
    const filter = (event.target as HTMLInputElement).value
      .trim()
      .toLocaleLowerCase();
    this.dataSource.filter = filter;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
 
  

  
  exportToExcel(data: any[], fileName: string): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = {
      Sheets: { data: worksheet },
      SheetNames: ['data'],
    };
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    const fileData: Blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });
    FileSaver.saveAs(
      fileData,
      fileName + '_export_' + new Date().getTime() + '.xlsx'
    );
  }
}
