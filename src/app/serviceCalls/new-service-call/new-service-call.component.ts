import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MatDialogRef } from '@angular/material/dialog';



@Component({
  selector: 'app-new-service-call',
  templateUrl: './new-service-call.component.html',
  styleUrls: ['./new-service-call.component.scss']
})
export class NewServiceCallComponent implements OnInit {
  serviceCallForm!: FormGroup;
  loginUserName = '';

  constructor(private http: HttpClient, private dialogRef: MatDialogRef<NewServiceCallComponent>) { }

  ngOnInit(): void {
    this.loginUserName = localStorage.getItem('loginUserName') || '';
  
    this.serviceCallForm = new FormGroup({
      Priority: new FormControl('Low'), // Default priority set to 'Low'
      UserRequested: new FormControl(this.loginUserName), // Default to logged in user name
      CallbackPhone: new FormControl(''),
      Title: new FormControl('', Validators.required),
      ProblemDescription: new FormControl('', Validators.required),
      DepartmentName: new FormControl(''), // Add this line if DepartmentName is part of the form
      Status: new FormControl('New'), // Assuming 'New' is your default status
      IP: new FormControl('') // IP field added without validatio
      
    });
  }
  

  onSubmit(): void {
    if (this.serviceCallForm.valid) {
      const formData = {
        ...this.serviceCallForm.value,
        UserRequested: this.serviceCallForm.value.UserRequested || this.loginUserName,
        Status: this.serviceCallForm.value.Status || 'New', // Set Status to 'New' if it's not provided
        //SubcategoryID: 1 // Setting SubcategoryID as always 1
        // Include additional fields like IP and DepartmentName if necessary
       
      };
      console.log(formData)
      this.http.post(environment.apiUrl + 'NewServiceCallAPI', formData, { responseType: 'text' })
      .subscribe({
          next: (response) => {
            console.log('Response from the server:', response);
            this.dialogRef.close(); // Close the dialog
            // If you have MatSnackBar, you can show a message here
          },
          error: (error) => {
            console.error('Error creating service call:', error);
            // Handle the error here, possibly with a user notification
          }
        });
    }
  }
  

  closeDialog(): void {
    this.dialogRef.close();
  }
  
}
