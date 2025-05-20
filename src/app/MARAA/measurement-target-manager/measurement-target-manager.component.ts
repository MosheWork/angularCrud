import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../environments/environment';
import { MatSort } from '@angular/material/sort';
import { AuthenticationService } from '../../services/authentication-service/authentication-service.component'; // adjust path if needed
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';

export interface MeasurementTarget {
  MeasurementCode: string;
  MYear: number;
  MTarget: number | null;
  EntryUser?: string;
  EntryDate?: string;
}
export interface MeasurementDescription {
  MeasurementCode: string;
  MeasurementShortDesc: string;
  Label: string;

}
interface MeasurementOption {
  MeasurementCode: string;
  MeasurementShortDesc: string;
  Label: string;
}
@Component({
  selector: 'app-measurement-target-manager',
  templateUrl: './measurement-target-manager.component.html',
  styleUrls: ['./measurement-target-manager.component.scss']
})
export class MeasurementTargetManagerComponent implements OnInit {
  displayedColumns: string[] = ['MeasurementCode', 'MeasurementShortDesc', 'MYear', 'MTarget','EntryUser', 'EntryDate', 'actions'];
  dataSource = new MatTableDataSource<MeasurementTarget>();
  measurementDescriptions: { [code: string]: string } = {};
  measurementOptions: MeasurementOption[] = [];
  loginUserName: string = '';
  filterValue: string = '';


  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private authenticationService: AuthenticationService) {}

  ngOnInit(): void {
    // ✅ Load data immediately (does NOT depend on loginUserName)
    this.loadDescriptions();
    this.loadTargets();
  
    // ✅ Then get the authenticated user (used only when saving)
    this.authenticationService.getAuthentication().subscribe(
      (res) => {
        const user = res.message.split('\\')[1].toUpperCase();
        this.loginUserName = user;
        console.log('✅ Authenticated user:', user);
      },
      (error) => {
        console.error('❌ Failed to authenticate user:', error);
      }
    );
  
    // ✅ Load measurement dropdown options
    this.http.get<MeasurementOption[]>(`${environment.apiUrl}/MeasurementDataMoshe/GetMeasurementsCodeAndShortDesc`)
      .subscribe(data => {
        this.measurementOptions = data;
      });
      this.dataSource.filterPredicate = (data: MeasurementTarget, filter: string): boolean => {
        const shortDesc = this.getShortDesc(data.MeasurementCode);
        const combined = (
          data.MeasurementCode +
          shortDesc +
          (data.MYear ?? '') +
          (data.MTarget ?? '') +
          (data.EntryUser ?? '')
        ).toString().toLowerCase();
      
        return combined.includes(filter.trim().toLowerCase());
      };
      
      
  }
  
  

  loadDescriptions(): void {
    this.http.get<MeasurementDescription[]>(`${environment.apiUrl}/MeasurementDataMoshe/GetMeasurementsCodeAndShortDesc`)
      .subscribe(descs => {
        this.measurementDescriptions = descs.reduce((acc, curr) => {
          acc[curr.MeasurementCode] = curr.MeasurementShortDesc;
          return acc;
        }, {} as { [code: string]: string });
      });
  }

  loadTargets(): void {
    this.http.get<MeasurementTarget[]>(`${environment.apiUrl}/MeasurementDataMoshe/GetMeasurementTargets`)
      .subscribe(data => {
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;

      });
  }

  getShortDesc(code: string): string {
    return this.measurementDescriptions[code] || '';
  }

  saveTarget(row: MeasurementTarget): void {
    const payload = {
      ...row,
      EntryUser: this.loginUserName
    };
  
    this.http.post(`${environment.apiUrl}/MeasurementDataMoshe/UpsertMeasurementTarget`, payload)
      .subscribe(() => {
        alert('✅ עודכן בהצלחה');
      }, () => {
        alert('❌ שגיאה בעדכון');
      });
  }

  addNewRow(): void {
    const newRow: MeasurementTarget & { isNew?: boolean } = {
      MeasurementCode: '',
      MYear: new Date().getFullYear(),
      MTarget: null,
      isNew: true // ✅ custom flag
    };
    this.dataSource.data = [newRow, ...this.dataSource.data];
    this.paginator.firstPage();
  }
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  applyFilter(): void {
    this.dataSource.filter = this.filterValue.trim().toLowerCase();
  }
}
