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
  displayedColumns: string[] = ['DeptInHospital', 'CompanyName', 'Name', 'Position', 'Phone', 'Email', 'Description', 'actions'];
  filteredContacts = new MatTableDataSource<any>(this.contacts);
  ApplicationID: number;

  constructor(
    public dialogRef: MatDialogRef<ContactsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient,
    public dialog: MatDialog
  ) {
    this.ApplicationID = data.ApplicationID;
  }

  ngOnInit(): void {
    this.fetchContactsByApplicationID(this.ApplicationID);
  }

  fetchContactsByApplicationID(ApplicationID: number): void {
    this.http.get<any[]>(`${environment.apiUrl}ContactsInfoAPI/GetContactsByApplication/${ApplicationID}`).subscribe((data: any[]) => {
      this.contacts = data;
      this.filteredContacts.data = this.contacts;
    }, error => {
      console.error(`Error fetching contacts for application ID ${ApplicationID}:`, error);
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
        console.log('Contact to update:', contact); // Log the contact being updated
        console.log('Result:', result); // Log the result from the dialog
        if (result && result.id !== null) {
          this.updateContact(result.id, { ...result, ApplicationID: this.ApplicationID });
        } else {
          console.error('Contact ID is undefined');
        }
      }
    });
  }

  updateContact(id: number, contact: any): void {
    console.log('Updating contact with ID:', id); // Log the ID being passed
    console.log('Updating contact with data:', contact); // Log the contact data being sent
    this.http.put<any>(`${environment.apiUrl}ContactsInfoAPI/UpdateContact/${id}`, contact).subscribe(() => {
      this.fetchContactsByApplicationID(this.ApplicationID);
    }, error => {
      console.error('Error updating contact:', error);
    });
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddEditContactDialogComponent, {
      width: '600px',
      data: { isEdit: false, ApplicationID: this.ApplicationID }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.addContact({ ...result, ApplicationID: this.ApplicationID });
      }
    });
  }

  addContact(contact: any): void {
    this.http.post<any>(`${environment.apiUrl}ContactsInfoAPI/CreateContact`, contact).subscribe(() => {
      this.fetchContactsByApplicationID(this.ApplicationID);
    }, error => {
      console.error('Error adding contact:', error);
    });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
