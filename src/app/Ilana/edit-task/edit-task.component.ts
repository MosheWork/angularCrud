import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-edit-task',
  templateUrl: './edit-task.component.html',
  styleUrls: ['./edit-task.component.scss']
})
export class EditTaskComponent {
  taskForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    public dialogRef: MatDialogRef<EditTaskComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.taskForm = this.fb.group({
      TaskName: [data.TaskName],
      TaskDescription: [data.TaskDescription],
      Status: [data.Status],
      StartDate: [data.StartDate],
      EndDate: [data.EndDate],
      DueDate: [data.DueDate],
      IsRecurring: [data.IsRecurring]
    });
  }

  onSubmit() {
    this.http.put(environment.apiUrl + 'IlanaTaskManager/tasks/' + this.data.TaskId, this.taskForm.value).subscribe(response => {
      console.log('Task updated', response);
      this.dialogRef.close('refresh');
    });
  }
}
