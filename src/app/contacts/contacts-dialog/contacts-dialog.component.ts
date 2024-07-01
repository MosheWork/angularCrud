import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../environments/environment';
import { AddEditContactDialogComponent } from '../add-edit-contact-dialog/add-edit-contact-dialog.component';

@Component({
  selector: 'app-contacts-dialog',
  templateUrl: './contacts-dialog.component.html',
  styleUrls: ['./contacts-dialog.component.scss']
})
export class ContactsDialogComponent implements OnInit {
  contacts: any[] = [];
  displayedColumns: string[] = ['deptInHospital', 'companyName', 'name', 'position', 'phone', 'email', 'description', 'actions'];
  filteredContacts = new MatTableDataSource<any>(this.contacts);
  applicationID: number;

  constructor(
    public dialogRef: MatDialogRef<ContactsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient,
    public dialog: MatDialog
  ) {
    this.applicationID = data.applicationID;
  }

  ngOnInit(): void {
    this.fetchContactsByApplicationID(this.applicationID);
  }

  fetchContactsByApplicationID(applicationID: number): void {
    this.http.get<any[]>(`${environment.apiUrl}ContactsInfoAPI/GetContactsByApplication/${applicationID}`).subscribe((data: any[]) => {
      this.contacts = data;
      this.filteredContacts.data = this.contacts;
    }, error => {
      console.error(`Error fetching contacts for application ID ${applicationID}:`, error);
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.filteredContacts.filter = filterValue.trim().toLowerCase();
  }

  openEditDialog(contact: any): void {
    const dialogRef = this.dialog.open(AddEditContactDialogComponent, {
      width: '600px',
      data: { isEdit: true, contact }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.updateContact(contact.id, { ...result, applicationID: this.applicationID });
      }
    });
  }

  updateContact(id: number, contact: any): void {
    this.http.put<any>(`${environment.apiUrl}ContactsInfoAPI/UpdateContact/${id}`, contact).subscribe(() => {
      this.fetchContactsByApplicationID(this.applicationID);
    }, error => {
      console.error('Error updating contact:', error);
    });
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddEditContactDialogComponent, {
      width: '600px',
      data: { isEdit: false, applicationID: this.applicationID }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.addContact({ ...result, applicationID: this.applicationID });
      }
    });
  }

  addContact(contact: any): void {
    this.http.post<any>(`${environment.apiUrl}ContactsInfoAPI/CreateContact`, contact).subscribe(() => {
      this.fetchContactsByApplicationID(this.applicationID);
    }, error => {
      console.error('Error adding contact:', error);
    });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
