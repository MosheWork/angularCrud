import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../environments/environment';

export interface MeasurementTarget {
  MeasurementCode: string;
  MYear: number;
  MTarget: number | null;
}

@Component({
  selector: 'app-measurement-target-manager',
  templateUrl: './measurement-target-manager.component.html',
  styleUrls: ['./measurement-target-manager.component.scss']
})
export class MeasurementTargetManagerComponent implements OnInit {
  displayedColumns: string[] = ['MeasurementCode', 'MYear', 'MTarget', 'actions'];
  dataSource = new MatTableDataSource<MeasurementTarget>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadTargets();
  }

  loadTargets(): void {
    this.http.get<MeasurementTarget[]>(`${environment.apiUrl}/MeasurementDataMoshe/GetMeasurementTargets`)
      .subscribe(data => {
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
      });
  }

  saveTarget(row: MeasurementTarget): void {
    this.http.post(`${environment.apiUrl}/MeasurementDataMoshe/UpsertMeasurementTarget`, row)
      .subscribe(() => {
        alert('עודכן בהצלחה');
      }, () => {
        alert('שגיאה בעדכון');
      });
  }
  addNewRow(): void {
    const newRow: MeasurementTarget = {
      MeasurementCode: '',
      MYear: new Date().getFullYear(),
      MTarget: null
    };
  
    const currentData = this.dataSource.data;
    this.dataSource.data = [newRow, ...currentData]; // Prepend the new row
  
    this.paginator.firstPage(); // Ensure it's visible on the first page
  }
}
