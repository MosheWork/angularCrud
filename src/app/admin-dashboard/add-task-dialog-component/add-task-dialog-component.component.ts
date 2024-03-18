import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms'; // Add this line

@Component({
  selector: 'app-add-task-dialog-component',
  templateUrl: './add-task-dialog-component.component.html',
  styleUrls: ['./add-task-dialog-component.component.scss']
})
export class AddTaskDialogComponentComponent {

  taskName: string = ''; // Initialize the property

  constructor(public dialogRef: MatDialogRef<AddTaskDialogComponentComponent>) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  saveTask(): void {
    const taskData = {
      taskName: this.taskName,
      // other fields
    };
    // Implement the logic to send the taskData to the server via your API
    // If successful, close the dialog and return the new task data
    this.dialogRef.close(taskData);
  }

}
