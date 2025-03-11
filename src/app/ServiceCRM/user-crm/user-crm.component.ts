import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PhoneCallDialogComponent } from '../phone-call-dialog/phone-call-dialog.component';
import { MatDialog } from '@angular/material/dialog';


@Component({
  selector: 'app-user-crm',
  templateUrl: './user-crm.component.html',
  styleUrls: ['./user-crm.component.scss']
})
export class UserCRMComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'CaseNumber', 'DepartmentName', 'EnterDepartDate', 'EnterDepartTime', 'ExitHospTime',
    'LastName', 'FirstName', 'Telephone', 'Mobile', 'BirthDate', 'DeathDate',
    'IsBirthday', 'CaseManagerStatus', 'CaseManagerCategory', 'CaseManagerUpdate' ,'CaseManagerRemarks',
  ];
  
  dataSource = new MatTableDataSource<any>([]);
  isLoading: boolean = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.fetchData();

  }

 

  fetchData(): void {
    this.isLoading = true;
  
    this.http.get<any[]>(`${environment.apiUrl}ServiceCRM`).subscribe(data => {
      // ✅ Convert date fields to actual Date objects for sorting
      this.dataSource.data = data.map(item => ({
        ...item,
        EnterDepartDate: item.EnterDepartDate ? new Date(item.EnterDepartDate) : null,
        CaseManagerUpdate: item.CaseManagerUpdate ? new Date(item.CaseManagerUpdate) : null
      }));
  
      this.isLoading = false;
  
      // ✅ Ensure sort & paginator are applied AFTER data is loaded
      setTimeout(() => {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      });
    });
  }
  
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openPhoneCallDialog(row: any) {
    const dialogRef = this.dialog.open(PhoneCallDialogComponent, {
      width: '600px',
      data: row
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        row.CaseManagerStatus = result.caseManagerStatus;
        row.CaseManagerCategory = result.caseManagerCategory;
        row.CaseManagerUpdate = result.caseManagerUpdate;
        row.CaseManagerRemarks = result.caseManagerRemarks;
        // You can also call an API to update this on the backend
      }
    });
  }
}
