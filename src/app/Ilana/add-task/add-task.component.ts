import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-add-task',
  templateUrl: './add-task.component.html',
  styleUrls: ['./add-task.component.scss']
})
export class AddTaskComponent {
  taskForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    public dialogRef: MatDialogRef<AddTaskComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.taskForm = this.fb.group({
      taskName: [''],
      taskDescription: [''],
      status: [''],
      startDate: [''],
      endDate: [''],
      dueDate: [''],
      isRecurring: [false]
    });
  }

  onSubmit() {
    this.http.post(environment.apiUrl + 'IlanaTaskManager/tasks', this.taskForm.value).subscribe(response => {
      console.log('Task added', response);
      this.dialogRef.close('refresh');
    });
  }
}
