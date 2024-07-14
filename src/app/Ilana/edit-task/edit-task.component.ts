import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-edit-task',
  templateUrl: './edit-task.component.html',
  styleUrls: ['./edit-task.component.scss']
})
export class EditTaskComponent implements OnInit {
  taskForm: FormGroup;
  users: any[] = [];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    public dialogRef: MatDialogRef<EditTaskComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.taskForm = this.fb.group({
      taskName: [data.TaskName],
      taskDescription: [data.TaskDescription],
      startDate: [data.StartDate],
      assignedUsers: [data.AssignedUsers.map((user: any) => user.EmployeeID)] // Map to IDs if needed
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.http.get<any[]>(environment.apiUrl + 'IlanaTaskManager/employees').subscribe(data => {
      this.users = data;
    });
  }

  onSubmit(): void {
    const updatedTask = {
      ...this.taskForm.value,
      TaskId: this.data.TaskId,
      AssignedUsers: this.taskForm.value.assignedUsers.filter((user: any) => user !== null)
    };
    this.http.put(environment.apiUrl + 'IlanaTaskManager/tasks/' + this.data.TaskId, updatedTask).subscribe(response => {
      console.log('Task updated', response);
      this.dialogRef.close('refresh');
    });
  }
}
