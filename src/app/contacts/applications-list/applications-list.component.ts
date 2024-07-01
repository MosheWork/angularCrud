import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';
import { AddEditApplicationDialogComponent } from '../add-edit-application-dialog/add-edit-application-dialog.component';
import { ContactsDialogComponent } from '../contacts-dialog/contacts-dialog.component';

@Component({
  selector: 'app-applications-list',
  templateUrl: './applications-list.component.html',
  styleUrls: ['./applications-list.component.scss']
})
export class ApplicationsListComponent implements OnInit {
  applications: any[] = [];
  displayedColumns: string[] = ['applicationName', 'applicationDescription', 'companyName', 'usedBy', 'applicationNameInEnglish','userInCharge', 'actions'];
  filteredApplications = new MatTableDataSource<any>(this.applications);

  constructor(private http: HttpClient, public dialog: MatDialog) { }

  ngOnInit(): void {
    this.fetchApplications();
  }

  fetchApplications(): void {
    this.http.get<any[]>(`${environment.apiUrl}ContactsInfoAPI/GetApplicationUserInCharge`).subscribe((data: any[]) => {
      this.applications = data;
      this.filteredApplications.data = this.applications;
    }, error => {
      console.error('Error fetching applications:', error);
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.filteredApplications.filter = filterValue.trim().toLowerCase();
  }

  openEditDialog(application: any): void {
    const dialogRef = this.dialog.open(AddEditApplicationDialogComponent, {
      width: '600px',
      data: { isEdit: true, application }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.updateApplication(application.applicationID, result);
      }
    });
  }

  updateApplication(id: number, application: any): void {
    this.http.put<any>(`${environment.apiUrl}ContactsInfoAPI/UpdateApplication/${id}`, application).subscribe(() => {
      this.fetchApplications();
    }, error => {
      console.error('Error updating application:', error);
    });
  }

  addApplication(application: any): void {
    this.http.post<any>(`${environment.apiUrl}ContactsInfoAPI/CreateApplication`, application).subscribe(() => {
      this.fetchApplications();
    }, error => {
      console.error('Error adding application:', error);
    });
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddEditApplicationDialogComponent, {
      width: '600px',
      data: { isEdit: false }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.addApplication(result);
      }
    });
  }

  openContactsDialog(applicationID: number): void {
    const dialogRef = this.dialog.open(ContactsDialogComponent, {
      width: '1200px',
      data: { applicationID }
    });

    dialogRef.afterClosed().subscribe(result => {
      // Handle any actions after the dialog is closed if needed
    });
  }
}
