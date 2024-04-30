import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';

@Component({
  selector: 'app-row-edit-dialog',
  templateUrl: './row-edit-dialog.component.html',
  styleUrls: ['./row-edit-dialog.component.scss'],
})
export class RowEditDialogComponent implements OnInit {
  form: FormGroup;
  teams: any[] = [];
  statuses: any[] = [];
  filteredCategories: any[] = [];
  categories: any[] = [];
  users: any[] = [];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<RowEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient
  ) {
    this.form = this.fb.group({
      teamInCharge: [null, Validators.required],
      userInCharge: [null, Validators.required],
      category2: [null, Validators.required],
      // Add additional form controls here if necessary
    });
  }

  ngOnInit(): void {
    this.loadTeams(); // Continues to load teams and initializes form
    this.loadStatuses();
    this.initializeFormControls();

    // Subscribe to teamInCharge changes
    this.form.get('teamInCharge')?.valueChanges.subscribe((team) => {
      if (team) {
        this.loadUsers(team.teamID);
        this.loadCategories(team.teamID);
      }
    });
  }
  loadTeams(): void {
    this.http
      .get<any[]>(
        environment.apiUrl + 'GetDiffrentListServiceAPI/TeamsInCharge'
      )
      .subscribe(
        (data) => {
          this.teams = data;
          this.setInitialTeam();
        },
        (error) => {
          console.error('Could not load teams', error);
        }
      );
  }

  setInitialTeam(): void {
    if (this.data.rowData && this.data.rowData.teamInCharge) {
      const defaultTeam = this.teams.find(
        (team) => team.name === this.data.rowData.teamInCharge
      );
      if (defaultTeam) {
        this.form.get('teamInCharge')?.setValue(defaultTeam);
        this.loadCategories(defaultTeam.teamID);
        this.loadUsers(defaultTeam.teamID);
      }
    }
  }

  loadStatuses(): void {
    this.http
      .get<any[]>(environment.apiUrl + 'GetDiffrentListServiceAPI/Statuses')
      .subscribe(
        (data) => {
          this.statuses = data;
        },
        (error) => {
          console.error('Could not load statuses', error);
        }
      );
  }

  onTeamChange(team: any): void {
    const teamID = team.teamID;
    this.filteredCategories = this.categories.filter(
      (category) => category.teamID === teamID
    );
    this.loadCategories(teamID);
    this.loadUsers(teamID);
  }

  loadCategories(teamID: string): void {
    this.http
      .get<any[]>(environment.apiUrl + 'GetDiffrentListServiceAPI/Categories')
      .subscribe(
        (data) => {
          this.categories = data.filter(
            (category) => category.teamID === teamID
          );
          this.filteredCategories = [...this.categories]; // Update the UI
          // After loading, check if we need to set a default category
          if (this.data.rowData && this.data.rowData.category2) {
            const defaultCategory = this.categories.find(
              (category) =>
                category.categoryName === this.data.rowData.category2
            );
            if (defaultCategory) {
              this.form.get('category2')?.setValue(defaultCategory);
            }
          } else {
            // Reset or set to a default value if no specific category should be selected
            this.form.get('category2')?.setValue(null);
          }
        },
        (error) => {
          console.error('Could not load categories', error);
        }
      );
  }

  setInitialCategory(): void {
    if (this.data.rowData && this.data.rowData.category2) {
      const defaultCategory = this.filteredCategories.find(
        (category) => category.categoryName === this.data.rowData.category2
      );
      if (defaultCategory) {
        this.form.get('category2')?.setValue(defaultCategory);
      }
    }
  }

  loadUsers(teamID: string): void {
    this.http
      .get<any[]>(environment.apiUrl + 'GetDiffrentListServiceAPI/UsersList')
      .subscribe(
        (data) => {
          this.users = data.filter((user) => user.teamID === teamID);
          // After loading, check if we need to set a default user
          if (this.data.rowData && this.data.rowData.userInChargeEmployeeID) {
            const defaultUser = this.users.find(
              (user) =>
                user.employeeID === this.data.rowData.userInChargeEmployeeID
            );
            if (defaultUser) {
              this.form.get('userInCharge')?.setValue(defaultUser.employeeID);
            }
          } else {
            // Reset or set to a default value if no specific user should be selected
            this.form.get('userInCharge')?.setValue(null);
          }
        },
        (error) => {
          console.error('Error loading users:', error);
        }
      );
  }

  setInitialUser(): void {
    if (this.data.rowData && this.data.rowData.userInChargeEmployeeID) {
      const defaultUser = this.users.find(
        (user) => user.employeeID === this.data.rowData.userInChargeEmployeeID
      );
      if (defaultUser) {
        this.form.get('userInCharge')?.setValue(defaultUser.employeeID);
      }
    }
  }

  save(): void {
    if (this.form.valid) {
      const requestData = {
        ...this.form.value,
        teamInCharge: this.form.value.teamInCharge.name,
        category2: this.form.value.category2.categoryName,
        userInChargeEmployeeID: this.form.value.userInCharge,
      };
      this.dialogRef.close(requestData);
    } else {
      console.error('Form is not valid.');
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  private initializeFormControls(): void {
    // Define an object to hold initial form control values
    const initialFormValues: { [key: string]: any } = {
      teamInCharge: null, // Will be set after teams are loaded
      userInCharge: null, // Will be set after users are loaded
      category2: null, // Will be set after categories are loaded
      // Initialize other fields with values from data.rowData or set defaults
      priority: this.data.rowData?.priority || '', // Example for other fields
      title: this.data.rowData?.title || '',
      problemDescription: this.data.rowData?.problemDescription || '',
      solutionText: this.data.rowData?.solutionText || '',
      comments: this.data.rowData?.comments || '',
      status: this.data.rowData?.status || '',
      // Add other fields as necessary
    };

    // Create the form group with initial values
    this.form = this.fb.group(initialFormValues);
  }
}
