import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-row-edit-dialog',
  templateUrl: './row-edit-dialog.component.html',
  styleUrls: ['./row-edit-dialog.component.scss']
})
export class RowEditDialogComponent implements OnInit {
  form: FormGroup;
  teams: any[] = []; // Add this line to hold the team list
  statuses: any[] = []; // Add this line to hold the status list


  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<RowEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient // Inject HttpClient
  ) {
    this.form = this.fb.group({});
  }

  ngOnInit(): void {
    this.loadTeams(); // Call this method to load teams from the API
    this.loadStatuses(); // Load statuses when the component initializes

    const formControls: { [key: string]: any } = {};
    Object.keys(this.data.rowData).forEach(key => {
      // Assume that we have an array of keys that are not required
      const nonRequiredFields = [
        'timeClosed', 
        'solutionText', 
        'comments', 
        'mainCategory', 
        'category2', 
        'category3', 
        'teamInCharge', 
        'userRequestedEmployeeID', 
        'userInChargeEmployeeID'
      ];
      
      const isRequired = !nonRequiredFields.includes(key);
      formControls[key] = isRequired 
        ? [this.data.rowData[key], Validators.required]
        : [this.data.rowData[key]]; // No validators for non-required fields
    });
    this.form = this.fb.group(formControls);
  }
  
  
  save(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    } else {
      console.error("Form is not valid.");
  
      // Log the form values and individual control errors
      console.log("Form values:", this.form.value);
      Object.keys(this.form.controls).forEach(key => {
        const controlErrors = this.form.controls[key].errors;
        if (controlErrors != null) {
          Object.keys(controlErrors).forEach(keyError => {
            console.log('Key control: ' + key + ', keyError: ' + keyError + ', err value:', controlErrors[keyError]);
          });
        }
      });
    }


    
  }
  
  
  
  

  objectKeys = Object.keys;

  getType(key: string): string {
    const typeMap: { [key: string]: string } = {
      TimeOpened: 'datetime-local',
      TimeClosed: 'datetime-local',
      // Define other specific types here
      UserRequestedEmployeeID: 'number',
      UserInChargeEmployeeID: 'number'
    };
    return typeMap[key] || 'text';
  }

  private transformDataToPascalCase(data: any): any {
    const result: any = {};
    Object.keys(data).forEach(key => {
      const pascalKey = key.replace(/(\w)(\w*)/g,
        (g0, g1, g2) => g1.toUpperCase() + g2.toLowerCase());
      result[pascalKey] = data[key];
    });
    return result;
  }

  getLabel(field: string): string {
    const labels: { [key: string]: string } = {
      serviceCallID: 'ID',
      timeOpened: 'Time Opened',
      timeClosed: 'Time Closed',
      priority: 'Priority',
      status: 'Status',
      userRequested: 'User Requested',
      callbackPhone: 'Callback Phone',
      title: 'Title',
      problemDescription: 'Problem Description',
      solutionText: 'Solution Text',
      comments: 'Comments',
      IP: 'IP Address',
      departmentName: 'Department Name',
      mainCategory: 'Main Category',
      category2: 'Secondary Category',
      category3: 'Tertiary Category',
      teamInCharge: 'Team In Charge',
      userRequestedEmployeeID: 'User Requested Employee ID',
      userInChargeEmployeeID: 'User In Charge Employee ID',
      // ... any other fields you have
    };
    return labels[field] || field;
  }
  loadTeams(): void {
    this.http.get<any[]>('http://localhost:7144/api/GetDiffrentListServiceAPI/TeamsInCharge').subscribe(data => {
      this.teams = data;
    }, error => {
      console.error('Could not load teams', error);
    });
  }
  loadStatuses(): void {
    this.http.get<any[]>('http://localhost:7144/api/GetDiffrentListServiceAPI/Statuses').subscribe(data => {
      this.statuses = data;
    }, error => {
      console.error('Could not load statuses', error);
    });
  }
}
