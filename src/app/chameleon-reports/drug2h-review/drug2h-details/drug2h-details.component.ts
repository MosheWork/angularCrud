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
    // 'Drug',
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
    // 'Next_Execution_Date',
    'Time_Difference_HHMM',
  ];

  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  filterForm: FormGroup;
  loading = false;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.filterForm = this.fb.group({
      // accept both Unit_Name and unit_Name
      unit: [data?.Unit_Name || data?.unit_Name || ''],
    });
  }

  ngOnInit(): void {
    console.log('Dialog received data:', this.data);
    const unit = this.data?.Unit_Name || this.data?.unit_Name;
    if (unit) {
      this.fetchDrugDetails(unit);
    } else {
      console.error('No Unit_Name received in dialog data');
    }
  }

  fetchDrugDetails(unit: string): void {
    this.loading = true;

    let params = new HttpParams().set('unit', unit);

    if (this.data?.year?.length) {
      params = params.set('year', this.data.year.join(','));
    }
    if (this.data?.quarter?.length) {
      params = params.set('quarter', this.data.quarter.join(','));
    }
    if (this.data?.half) {
      params = params.set('half', this.data.half);
    }

    console.log('Calling details API with params:', params.toString());

    this.http.get<any[]>(`${environment.apiUrl}Drug2hReview/details`, { params }).subscribe(
      (rows) => {
        this.loading = false;

        // Lowercase first letter (always) on textual fields we display.
        // No helpers; inline transform.
        const fieldsToFix = new Set<string>([
          'Unit_Name',
          // 'Drug', // uncomment if you show this column
          'Drugs_Text',
          'Basic_Name',
          'Remarks',
          'Exec_Status_Name',
          'IV_State_Desc',
          'Way_Of_Giving',
          'First_Name',
          'Last_Name',
        ]);

        const processed = (rows || []).map((row) => {
          const copy: any = { ...row };

          // also tolerate payloads that used lowercased key "unit_Name"
          if (!copy.Unit_Name && copy.unit_Name) {
            copy.Unit_Name = copy.unit_Name;
          }

          fieldsToFix.forEach((f) => {
            const v = copy[f];
            if (typeof v === 'string' && v.length > 0) {
              copy[f] = v.charAt(0).toLowerCase() + v.slice(1);
            }
          });

          return copy;
        });

        this.dataSource.data = processed;
      },
      (error) => {
        this.loading = false;
        console.error('Failed to fetch drug details:', error);
      }
    );
  }

  onFilterSubmit(): void {
    const unit = this.filterForm.get('unit')?.value;
    this.fetchDrugDetails(unit);
  }

  exportToExcel(): void {
    const data = this.dataSource.data;
    if (!data || data.length === 0) {
      console.error('No data available to export');
      return;
    }
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'drug2h_details.xlsx';
    link.click();
  }

  isTimeDifferenceAboveTwoHours(timeDifference: string): boolean {
    if (!timeDifference) return false;
    const [hours, minutes] = timeDifference.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    return totalMinutes > 120;
  }
}
