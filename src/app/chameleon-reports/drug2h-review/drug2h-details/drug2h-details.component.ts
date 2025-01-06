import { Component, OnInit, Inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { FormBuilder, FormGroup } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as XLSX from 'xlsx';


@Component({
  selector: 'app-drug2h-details',
  templateUrl: './drug2h-details.component.html',
  styleUrls: ['./drug2h-details.component.scss'],
})
export class Drug2hDetailsComponent implements OnInit {
  displayedColumns: string[] = [
    'Unit_Name',
    'Order_ID',
    //'Drug',
    'Drugs_Text',
    'Basic_Name',
    'Remarks',
    'Exec_Status',
    'Exec_Status_Name',
   // 'IV_State',
    'IV_State_Desc',
    'Way_Of_Giving',
    'Order_Stop_Date',
    'Patient',
    'First_Name',
    'Last_Name',
    'Id_Num',
    'Execution_Date',
    //'Next_Execution_Date',
    'Time_Difference_HHMM',
  ];
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]); // Updated to MatTableDataSource for proper integration
  filterForm: FormGroup;
  loading: boolean = false; // Add loading state

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
    this.loading = true; // Show spinner

    const params = new HttpParams().set('unit', unit);
  
    this.http.get<any[]>(`${environment.apiUrl}Drug2hReview/details`, { params }).subscribe(
      (data) => {
        this.loading = false; // Hide spinner when data is successfully fetched

        if (data && Array.isArray(data)) {
          this.dataSource.data = data; // Update table data
          console.log('Drug details fetched successfully:', data);
        } else {
          console.warn('Unexpected response format:', data);
        }
      },
      (error) => {
        this.loading = false; // Hide spinner on error

        console.error('Failed to fetch drug details:', error);
      }
    );
  }
  

  onFilterSubmit(): void {
    const unit = this.filterForm.get('unit')?.value;
    this.fetchDrugDetails(unit); // Fetch details when the filter form is submitted
  }
  exportToExcel(): void {
    // Extract the actual data array from MatTableDataSource
    const data = this.dataSource.data;
  
    // Check if the data array exists and is not empty
    if (!data || data.length === 0) {
      console.error('No data available to export');
      return;
    }
  
    // Convert the data array to a worksheet
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = {
      Sheets: { data: worksheet },
      SheetNames: ['data'],
    };
  
    // Write the workbook to a buffer
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
    // Create a Blob from the buffer
    const blob: Blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  
    // Download the Excel file
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'drug2h_details.xlsx';
    link.click();
  }
  
}
