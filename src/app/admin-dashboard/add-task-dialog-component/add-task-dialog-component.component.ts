import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
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

  
  dueTime: string = ''; // Holds the time as a string
  
  constructor(
    public dialogRef: MatDialogRef<AddTaskDialogComponentComponent>,
    private http: HttpClient // Inject HttpClient here
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  saveTask(): void {
    // Use current date/time as creation date if not provided
    const currentDate = new Date().toISOString();
  
    const taskData = {
      Task: {
        TaskName: this.taskName,
        Description: this.description,
        //CreationDate: this.creationDate || currentDate, // Use provided date or current date
        DueDate: this.dueDate || null, // Use provided due date or null if not provided
        CreatedBy: this.createdBy
      },
      AssignedADUserNames: this.assignedADUserNames.split(',') // Split into array if comma-separated
    };
  
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
    return this.taskName.trim() !== '' && this.description.trim() !== ''  && this.dueDate.trim() !== '' && this.createdBy.trim() !== '' && this.assignedADUserNames.trim() !== '';
  }
  dueDateChange(event: MatDatepickerInputEvent<Date>): void {
    const date = event.value ? event.value.toISOString().split('T')[0] : '';
    this.updateDueDateTime(date, this.dueTime);
  }
  
  dueTimeChange(): void {
    if(this.dueDate) {
      const datePart = this.dueDate.split('T')[0]; // Extract just the date part
      this.updateDueDateTime(datePart, this.dueTime);
    }
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
