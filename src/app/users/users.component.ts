import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { PermissionsDialogComponent } from './permissions-dialog/permissions-dialog.component'; // adjust the path as needed

export interface Users {
  employeeID: string;
  name: string;
  progress: string;
  color: string;
  btn: string;
  roles: string;
  department: string;
  // Add other properties as per your data structure
}

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements AfterViewInit {
  //Title1: string = '  רשימת קריאות  - ';
  Title2: string = 'סה"כ תוצאות   ';
  titleUnit: string = 'ניהול הרשאות';
  totalResults: number = 0;

  displayedColumns: string[] = [
    'employeeID',
    'firstName',
    'lastName',
    'adUserName',
    'cellNumber',
    'btn',
  ];
  dataSource: MatTableDataSource<Users> = new MatTableDataSource(); // Initialize dataSource

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, public dialog: MatDialog) {}

  ngAfterViewInit() {
    this.fetchData();
  }

  

  fetchData() {
    this.http
      .get<Users[]>('http://localhost:7144/api/Users')
      .subscribe((data) => {
        this.dataSource.data = data; // Set the data for dataSource
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
  openDialog(user: Users): void {
    const dialogRef = this.dialog.open(PermissionsDialogComponent, {
      width: 'auto', // Set your desired width
      height: 'auto', // Set your desired height
      data: user, // Passing the entire user object
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // result will contain the updated data if the user clicked "Update"
        console.log('Updated permissions:', result);
        // You can now send this data back to the server or update your local data source
        this.fetchData();
      }
    });
  }
 
}
