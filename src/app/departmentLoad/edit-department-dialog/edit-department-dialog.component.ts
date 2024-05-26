import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface DepartmentLoad {
  id: number;
  departName: string;
  currentPatients: number;
  totalBeds: number;
  currentStaff: number;
  totalStaff: number;
  patientComplexity: number;
  totalLoad?: number;
}

@Component({
  selector: 'app-edit-department-dialog',
  templateUrl: './edit-department-dialog.component.html',
  styleUrls: ['./edit-department-dialog.component.scss']
})
export class EditDepartmentDialogComponent {
  editForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<EditDepartmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DepartmentLoad,
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.editForm = this.fb.group({
      departName: [data.departName],
      currentPatients: [{ value: data.currentPatients, disabled: true }],
      totalBeds: [data.totalBeds],
      currentStaff: [data.currentStaff],
      totalStaff: [data.totalStaff],
      patientComplexity: [data.patientComplexity]
    });
  }

  onSave(): void {
    if (this.editForm.valid) {
      const updatedData = {
        ...this.data,
        ...this.editForm.getRawValue()
      };

      this.http.put(`${environment.apiUrl}ChamelleonCurrentPatientsAPI/UpdateDepartmentLoad/${this.data.id}`, updatedData)
        .subscribe(response => {
          this.dialogRef.close(updatedData);
        }, error => {
          console.error('Error updating department', error);
        });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
