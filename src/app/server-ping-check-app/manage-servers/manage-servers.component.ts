import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';
import { AddEditServerDialogComponent } from '../add-edit-server-dialog/add-edit-server-dialog.component';

@Component({
  selector: 'app-manage-servers',
  templateUrl: './manage-servers.component.html',
  styleUrls: ['./manage-servers.component.scss']
})
export class ManageServersComponent implements OnInit {
  servers: any[] = [];
  displayedColumns: string[] = ['hostname', 'description', 'type', 'createdBy', 'actions'];

  constructor(private http: HttpClient, public dialog: MatDialog) { }

  ngOnInit(): void {
    this.loadServers();
  }

  loadServers(): void {
    this.http.get<any[]>(`${environment.apiUrl}ServerPingCheckAPI/GetServers`).subscribe(servers => {
      this.servers = servers;
    }, error => {
      console.error('Error loading servers:', error);
    });
  }

  deleteServer(serverId: number): void {
    this.http.delete<any>(`${environment.apiUrl}ServerPingCheckAPI/DeleteServer/${serverId}`).subscribe(response => {
      this.loadServers();
    }, error => {
      console.error('Error deleting server:', error);
    });
  }

  confirmDeleteServer(serverId: number): void {
    const confirmation = window.confirm('Are you sure you want to delete this server?');
    if (confirmation) {
      this.deleteServer(serverId);
    }
  }

  openAddServerDialog(): void {
    const dialogRef = this.dialog.open(AddEditServerDialogComponent, {
      width: '300px',
      data: { server: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Dialog result:', result); // Add this line
        this.http.post(`${environment.apiUrl}ServerPingCheckAPI/CreateServer`, result).subscribe(() => {
          this.loadServers();
        }, error => {
          console.error('Error creating server:', error);
        });
      }
    });
  }

  editServer(server: any): void {
    const dialogRef = this.dialog.open(AddEditServerDialogComponent, {
      width: '300px',
      data: { server }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Dialog result:', result); // Add this line
        this.http.put(`${environment.apiUrl}ServerPingCheckAPI/UpdateServer/${server.serverId}`, result).subscribe(() => {
          this.loadServers();
        }, error => {
          console.error('Error updating server:', error);
        });
      }
    });
  }
}
