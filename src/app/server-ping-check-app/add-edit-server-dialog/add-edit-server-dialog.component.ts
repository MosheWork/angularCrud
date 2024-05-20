import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-add-edit-server-dialog',
  templateUrl: './add-edit-server-dialog.component.html',
  styleUrls: ['./add-edit-server-dialog.component.scss']
})
export class AddEditServerDialogComponent {
  server: any;

  constructor(
    public dialogRef: MatDialogRef<AddEditServerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient
  ) {
    this.server = data.server ? { ...data.server } : { hostname: '', description: '', createdBy: '' };
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.data.server) {
      // Edit server
      this.http.put(`${environment.apiUrl}ServerPingCheckAPI/UpdateServer/${this.server.serverId}`, this.server).subscribe(response => {
        this.dialogRef.close(true);
      }, error => {
        console.error('Error updating server:', error);
      });
    } else {
      // Add server
      this.http.post(`${environment.apiUrl}ServerPingCheckAPI/CreateServer`, this.server).subscribe(response => {
        this.dialogRef.close(true);
      }, error => {
        console.error('Error adding server:', error);
      });
    }
  }
}
