import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-edit-task-dialog',
  templateUrl: './edit-task-dialog.component.html',
  styleUrls: ['./edit-task-dialog.component.scss']
})
export class EditTaskDialogComponent {
  editTaskForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EditTaskDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.editTaskForm = this.fb.group({
      taskName: '',
      description: '',
      dueDate: '',
      status: '',
      userStatuses: ''
    });
  }

  ngOnInit(): void {
    // Use the injected task data to populate the form
    if (this.data.task) {
      this.editTaskForm.patchValue(this.data.task);
      console.log(this.data.task)
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (this.editTaskForm.valid) {
      // Pass the updated task back to the component that opened the dialog
      this.dialogRef.close(this.editTaskForm.value);
    }
  }
}
