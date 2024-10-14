import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from '../../environments/environment';  // Import environment


@Component({
  selector: 'app-shift-dialog',
  templateUrl: './shift-dialog.component.html',
  styleUrls: ['./shift-dialog.component.scss']
})
export class ShiftDialogComponent implements OnInit {
  shiftForm: FormGroup;
  employees: any[] = [];  // List of employees

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    public dialogRef: MatDialogRef<ShiftDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.shiftForm = this.fb.group({
      employeeId: [null, Validators.required], // Save EmployeeID
      comment: [this.data.comment || '', Validators.required]
    });
  }

  ngOnInit() {
    this.getEmployees();  // Fetch employees when dialog opens
  }

  // Fetch the list of employees from the backend
  getEmployees() {
    this.http.get<any[]>( environment.apiUrl+'oncallshifts/employees').subscribe({
      next: (data) => {
        this.employees = data;
      },
      error: (error) => {
        console.error('Error fetching employees:', error);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.shiftForm.valid) {
      const shiftData = this.shiftForm.value;  // This contains employeeId and comment
  
      // Find the employee based on the selected employeeId
      const selectedEmployee = this.employees.find(emp => emp.EmployeeID === shiftData.employeeId);
  
      // Add employeeName to the shiftData
      const shiftWithEmployeeName = {
        ...shiftData,
        employeeName: selectedEmployee ? `${selectedEmployee.FirstName} ${selectedEmployee.LastName}` : ''
      };
  
      console.log('Saving shift data with employeeName:', shiftWithEmployeeName);  // Log to ensure employeeName is included
  
      this.dialogRef.close(shiftWithEmployeeName);  // Pass back the form data, including employeeName
    }
  }
  
  
}
