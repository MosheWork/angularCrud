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
  // 🔽 Columns now expect first-letter-lowercase keys
  displayedColumns: string[] = [
    'unit_Name',
    'order_ID',
    // 'drug',
    'drugs_Text',
    'basic_Name',
    'remarks',
    'exec_Status',
    'exec_Status_Name',
    // 'iV_State',
    'iV_State_Desc',
    'way_Of_Giving',
    'order_Stop_Date',
    'patient',
    'first_Name',
    'last_Name',
    'id_Num',
    'execution_Date',
    // 'next_Execution_Date',
    'time_Difference_HHMM',
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

  /** Lowercase only the first letter of every top-level key */
  private normalizeKeysFirstLower<T extends Record<string, any>>(obj: T): any {
    const out: any = {};
    Object.keys(obj || {}).forEach((k) => {
      if (!k.length) return;
      const nk = k[0].toLowerCase() + k.slice(1);
      out[nk] = obj[k];
    });

    // Compatibility shim for unit name
    if (!out.unit_Name && (obj as any).Unit_Name) out.unit_Name = (obj as any).Unit_Name;
    if (!out.unit_Name && (obj as any).unit_Name) out.unit_Name = (obj as any).unit_Name;

    return out;
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

        // 1) Normalize keys: First letter lowercase (Order_ID -> order_ID, etc.)
        const normalized = (rows || []).map((r) => this.normalizeKeysFirstLower(r));

        // 2) Lowercase first character of selected TEXT FIELDS (values)
        const fieldsToFix = new Set<string>([
          'unit_Name',
          // 'drug', // uncomment if you show this column
          'drugs_Text',
          'basic_Name',
          'remarks',
          'exec_Status_Name',
          'iV_State_Desc',
          'way_Of_Giving',
          'first_Name',
          'last_Name',
        ]);

        const processed = normalized.map((row) => {
          const copy: any = { ...row };

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
