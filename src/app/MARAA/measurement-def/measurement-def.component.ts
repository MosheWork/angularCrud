// measurement-def.component.ts
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { FormBuilder, FormGroup } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { MatPaginator } from '@angular/material/paginator';
import { AfterViewInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { AuthenticationService } from '../../services/authentication-service/authentication-service.component'; // adjust path if needed


export interface MeasurementDefModel {
  MeasurementCode: string;
  MeasurementShortDesc?: string;
  date: string;
  department: string;
  EntryUser?: string;
  EntryDate?: string;
}


@Component({
  selector: 'app-measurement-def',
  templateUrl: './measurement-def.component.html',
  styleUrls: ['./measurement-def.component.scss']
})
export class MeasurementDefComponent implements OnInit,AfterViewInit  {
  displayedColumns: string[] = ['MeasurementCode', 'MeasurementShortDesc', 'date', 'department', 'EntryUser', 'EntryDate', 'actions'];
  dataSource = new MatTableDataSource<MeasurementDefModel>();
  formMap: { [code: string]: FormGroup } = {};

  constructor(private http: HttpClient, private fb: FormBuilder,private authenticationService: AuthenticationService) {}
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  loginUserName: string = '';

  ngOnInit(): void {
    this.loadData();

    this.authenticationService.getAuthentication().subscribe(res => {
      this.loginUserName = res.message.split('\\')[1].toUpperCase();
    });
  }

  loadData(): void {
    this.http.get<MeasurementDefModel[]>(`${environment.apiUrl}MeasurementDataMoshe/GetMeasurementColDefs`)
      .subscribe(data => {
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;

        data.forEach(row => {
          this.formMap[row.MeasurementCode] = this.fb.group({
            Department: [row.department || ''],
            Date: [row.date || '']
          });
        });
      });
  }
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

  }
  save(row: MeasurementDefModel): void {
    const payload = {
      ...row,
      EntryUser: this.loginUserName
    };
  
    this.http.post(`${environment.apiUrl}/MeasurementDataMoshe/UpsertMeasurementColDef`, payload)
      .subscribe({
        next: () => {
          alert('✅ נשמר בהצלחה');
          this.existingCodes.add(row.MeasurementCode);
          this.loadData(); // refresh to show updated EntryUser + EntryDate
        },
        error: err => {
          console.error('❌ שגיאה בשמירה:', err);
          alert('שגיאה בשמירת הנתונים');
        }
      });
  }
  
  addNewRow(): void {
    const newRow = {
      MeasurementCode: '',
      MeasurementShortDesc: '',
      date: '',
      department: '',
      isNew: true // used to mark as editable
    };
  
    // insert at the beginning
    this.dataSource.data = [newRow, ...this.dataSource.data];
  }
  
  deleteRow(measurementCode: string): void {
    if (!measurementCode) return;
  
    const confirmDelete = confirm(`האם אתה בטוח שברצונך למחוק את המדד ${measurementCode}?`);
    if (!confirmDelete) return;
  
    this.http.delete(`${environment.apiUrl}/MeasurementDataMoshe/ClearMeasurementColDef`, {
      params: { measurementCode }
    }).subscribe({
      next: () => {
        // Remove from dataSource
        this.dataSource.data = this.dataSource.data.filter(row => row.MeasurementCode !== measurementCode);
      },
      error: err => {
        console.error('❌ Error deleting row:', err);
        alert('שגיאה במחיקת המדד');
      }
    });
  }
  
  existingCodes: Set<string> = new Set();

fetchData(): void {
  this.http.get<MeasurementDefModel[]>(`${environment.apiUrl}/MeasurementDataMoshe/GetMeasurementColDef`)
    .subscribe(data => {
      this.dataSource.data = data;
      this.existingCodes = new Set(data.map(row => row.MeasurementCode));
    });
}
}
