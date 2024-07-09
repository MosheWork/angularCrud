import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../environments/environment';
import { AddEditContactDialogComponent } from '../contacts/add-edit-contact-dialog/add-edit-contact-dialog.component';

@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.scss']
})
export class ContactsComponent implements OnInit {
  contacts: any[] = [];
  displayedColumns: string[] = ['DeptInHospital', 'CompanyName', 'Name', 'Position', 'Phone', 'Email', 'Description', 'actions'];
  filteredContacts = new MatTableDataSource<any>(this.contacts);
  ApplicationID: number | null = null; // Provide a default value

  constructor(private http: HttpClient, public dialog: MatDialog, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.ApplicationID = this.route.snapshot.params['ApplicationID'];
    if (this.ApplicationID) {
      this.fetchContactsByApplicationID(this.ApplicationID);
    } else {
      this.fetchContacts();
    }
  }

  fetchContacts(): void {
    this.http.get<any[]>(`${environment.apiUrl}ContactsInfoAPI/GetContacts`).subscribe((data: any[]) => {
      this.contacts = data;
      this.filteredContacts.data = this.contacts;
    }, error => {
      console.error('Error fetching contacts:', error);
    });
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
        this.updateContact(contact.id, result);
      }
    });
  }

  updateContact(id: number, contact: any): void {
    this.http.put<any>(`${environment.apiUrl}ContactsInfoAPI/UpdateContact/${id}`, contact).subscribe(() => {
      if (this.ApplicationID) {
        this.fetchContactsByApplicationID(this.ApplicationID);
      } else {
        this.fetchContacts();
      }
    }, error => {
      console.error('Error updating contact:', error);
    });
  }

  addContact(contact: any): void {
    this.http.post<any>(`${environment.apiUrl}ContactsInfoAPI/CreateContact`, contact).subscribe(() => {
      if (this.ApplicationID) {
        this.fetchContactsByApplicationID(this.ApplicationID);
      } else {
        this.fetchContacts();
      }
    }, error => {
      console.error('Error adding contact:', error);
    });
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddEditContactDialogComponent, {
      width: '600px',
      data: { isEdit: false }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.addContact(result);
      }
    });
  }
}
