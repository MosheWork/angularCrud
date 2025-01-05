import { Component, OnInit, Inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { FormBuilder, FormGroup } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-drug2h-details',
  templateUrl: './drug2h-details.component.html',
  styleUrls: ['./drug2h-details.component.scss'],
})
export class Drug2hDetailsComponent implements OnInit {
  displayedColumns: string[] = [
    'Unit_Name',
    'Order_ID',
    'Drug',
    'Drugs_Text',
    'Basic_Name',
    'Remarks',
    'Exec_Status',
    'Exec_Status_Name',
    'IV_State',
    'IV_State_Desc',
    'Way_Of_Giving',
    'Order_Stop_Date',
    'Patient',
    'First_Name',
    'Last_Name',
    'Id_Num',
    'Execution_Date',
    'Next_Execution_Date',
    'Time_Difference_HHMM',
  ];
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]); // Updated to MatTableDataSource for proper integration
  filterForm: FormGroup;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.filterForm = this.fb.group({
      unit: [data.Unit_Name || ''], // Pre-fill the unit if passed from the dialog
    });
  }

  ngOnInit(): void {
    console.log('Dialog received data:', this.data); // Debug log
    if (this.data && this.data.Unit_Name) {
      this.fetchDrugDetails(this.data.Unit_Name);
    } else {
      console.error('No Unit_Name received in dialog data');
    }
  }

  fetchDrugDetails(unit: string): void {
    const params = new HttpParams().set('unit', unit);
  
    this.http.get<any[]>(`${environment.apiUrl}Drug2hReview/details`, { params }).subscribe(
      (data) => {
        if (data && Array.isArray(data)) {
          this.dataSource.data = data; // Update table data
          console.log('Drug details fetched successfully:', data);
        } else {
          console.warn('Unexpected response format:', data);
        }
      },
      (error) => {
        console.error('Failed to fetch drug details:', error);
      }
    );
  }
  

  onFilterSubmit(): void {
    const unit = this.filterForm.get('unit')?.value;
    this.fetchDrugDetails(unit); // Fetch details when the filter form is submitted
  }
}
