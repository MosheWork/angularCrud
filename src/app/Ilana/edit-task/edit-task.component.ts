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
  statusOptions: string[] = ['Not Started', 'In Progress', 'Completed'];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    public dialogRef: MatDialogRef<EditTaskComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.taskForm = this.fb.group({
      taskName: [data.TaskName],
      taskDescription: [data.TaskDescription],
      status: [data.Status],
      startDate: [data.StartDate],
      isRecurring: [data.IsRecurring],
      createdBy: [data.CreatedBy],
      assignedUsers: [data.AssignedUsers],
      checklistItem1: [data.ChecklistItem1],
      checklistItem2: [data.ChecklistItem2],
      checklistItem3: [data.ChecklistItem3],
      checklistItem4: [data.ChecklistItem4]
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
      AssignedUsers: this.taskForm.value.assignedUsers.filter((user: any) => user !== null).map((user: any) => typeof user === 'number' ? user : user.EmployeeID)
    };
    this.http.put(environment.apiUrl + 'IlanaTaskManager/tasks/' + this.data.TaskId, updatedTask).subscribe(response => {
      console.log('Task updated', response);
      this.dialogRef.close('refresh');
    });
  }
}
