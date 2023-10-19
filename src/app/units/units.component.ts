import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { EmployeeService } from '../services/employee.service';
import { CoreService } from '../core/core.service';
import { EmpAddEditComponent } from '../emp-add-edit/emp-add-edit.component';
//import * as xls from 'xlsx';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';


@Component({
  selector: 'app-units',
  templateUrl: './units.component.html',
  styleUrls: ['./units.component.scss'],
})
export class UnitsComponent implements OnInit{
 
  tableDataSource = new MatTableDataSource<any>();


  displayedColumns: string[] = [
    // must be small letter on start to get  from back end
    'unit',
    'name',
    'phone',
    'head_Nurse',

    //'profile_Code'
  ];
  dataSource!: MatTableDataSource<any>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private _dialog: MatDialog,
    private _empService: EmployeeService,
    private _coreService: CoreService,
  
  ) {}
  ngOnInit(): void {
    this.getUnitsList();
    this._empService.getAllTableData(this.tableDataSource);
  }
  openAddEditEmpForm() {
    const DialogRef = this._dialog.open(EmpAddEditComponent);
    DialogRef.afterClosed().subscribe({
      next: (val) => {
        if (val) {
          this.getUnitsList();
        }
      },
    });
  }

  getUnitsList() {
    this._empService.getUnitsList().subscribe({
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

  convertExcel() {
    var table_elt = document.getElementById('table');

    var workbook = XLSX.utils.table_to_book(table_elt);
    var ws = workbook.Sheets['Sheet1'];
    XLSX.utils.sheet_add_aoa(ws, [['Created ' + new Date().toISOString()]], {
      origin: -1,
    });
    XLSX.writeFile(workbook, 'Units.xlsb');
  }

  // exportToExceltest(objects: any[]) {
    
  //   // Create a workbook.
  //   const workbook = XLSX.utils.book_new();
  
  //   // Create a worksheet.
  //   const worksheet = XLSX.utils.aoa_to_sheet(objects);
  
  //   // Add the worksheet to the workbook.
  //   XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
  //   // Create a blob from the workbook.
  //   const blob = new Blob([XLSX.write(workbook, {type: 'binary'})], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  
  //   // Create a download link.
  //   const downloadLink = document.createElement('a');
  //   downloadLink.href = window.URL.createObjectURL(blob);
  //   downloadLink.download = 'data.xlsx';
  
  //   // Click the download link.
  //   downloadLink.click();
  // }

  exportToExcel(data: any[], fileName: string): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const fileData: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    FileSaver.saveAs(fileData, fileName + '_export_' + new Date().getTime() + '.xlsx');
  }

}
