import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-add-task',
  templateUrl: './add-task.component.html',
  styleUrls: ['./add-task.component.scss']
})
export class AddTaskComponent implements OnInit {
  taskForm: FormGroup;
  users: any[] = [];
  statusOptions: string[] = ['Not Started', 'In Progress', 'Completed'];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    public dialogRef: MatDialogRef<AddTaskComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.taskForm = this.fb.group({
      taskName: [''],
      taskDescription: [''],
      startDate: [''],
      assignedUsers: [[]]
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

  onSubmit() {
    const taskData = this.taskForm.value;
    const startDate = new Date(taskData.startDate);
    
    taskData.checklistItem1DueDate = new Date(startDate);
    taskData.checklistItem1DueDate.setDate(startDate.getDate() + 7);
    
    taskData.checklistItem2DueDate = new Date(startDate);
    taskData.checklistItem2DueDate.setDate(startDate.getDate() + 14);
    
    taskData.checklistItem3DueDate = new Date(startDate);
    taskData.checklistItem3DueDate.setDate(startDate.getDate() + 14);
    
    taskData.checklistItem4DueDate = new Date(startDate);
    taskData.checklistItem4DueDate.setDate(startDate.getDate() + 21);

    this.http.post(environment.apiUrl + 'IlanaTaskManager/tasks', taskData).subscribe(response => {
      console.log('Task added', response);
      this.dialogRef.close('refresh');
    });
  }
}
