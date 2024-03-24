import { Component, Inject } from '@angular/core';
import { MatDialogRef,MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';



@Component({
  selector: 'app-add-task-dialog-component',
  templateUrl: './add-task-dialog-component.component.html',
  styleUrls: ['./add-task-dialog-component.component.scss'],
})
export class AddTaskDialogComponentComponent {
  taskName: string = '';
  description: string = '';
  //creationDate: string = '';
  dueDate: string = '';
  createdBy: string = '';
  assignedADUserNames: string = '';
  selectedUsers: string[] = []; // Changed to support multiple selections
  dueTime: string = ''; // Holds the time as a string
  
  constructor(
    public dialogRef: MatDialogRef<AddTaskDialogComponentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any, // Import @Inject and use it here
    private http: HttpClient
  ) {  console.log(data); // Log to see if data is received
}

  onNoClick(): void {
    this.dialogRef.close();
  }
  loginUserName=''
  saveTask(): void {
    // Use current date/time as creation date if not provided
    const currentDate = new Date().toISOString();
    const combinedDueDateTime = `${this.dueDate}T${this.dueTime}`;
    this.loginUserName = (localStorage.getItem('loginUserName') || '').toUpperCase();

    const taskData = {

      Task: {
        TaskName: this.taskName,
        Description: this.description,
        //CreationDate: this.creationDate || currentDate, // Use provided date or current date
        DueDate: combinedDueDateTime, // Use the combined date and time
        CreatedBy: this.loginUserName
      },
      
      AssignedADUserNames: this.selectedUsers // Split into array if comma-separated
    };
    console.log(taskData)
    const url = environment.apiUrl +'AdminDashboardAPI/CreateTask';
  
    this.http.post(url, taskData).subscribe({
      next: (response: any) => {
        console.log(response);
        this.dialogRef.close(taskData); // Close dialog on success
      },
      error: (error: any) => {
        console.error('Error creating task:', error);
      }
    });
  }
  formValid(): boolean {
    return this.taskName.trim() !== '' &&
           this.description.trim() !== '' &&
           this.dueDate.trim() !== '' &&
           this.dueTime.trim() !== '' && // Include dueTime in the validation
           //this.createdBy.trim() !== '' &&
           this.selectedUsers.length > 0; // Adjust for an array
          }
  
  dueDateChange(event: MatDatepickerInputEvent<Date>): void {
    if (event.value) {
      this.dueDate = event.value.toISOString().split('T')[0];
    }
  }

dueTimeChange(event: Event): void {
  // Extract the time value from the event
  const element = event.target as HTMLInputElement;
  this.dueTime = element.value;
}

  // Helper method to update dueDate with both date and time
  updateDueDateTime(date: string, time: string): void {
    // If there's a valid date and time, combine them
    if (date && time) {
      this.dueDate = `${date}T${time}`;
    } else {
      this.dueDate = date; // Just set the date part if time is not specified
    }
  }
  
}
