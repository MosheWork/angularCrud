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
  measurementCode: string;
  mYear: number;
  mTarget: number | null;
  entryUser?: string;
  entryDate?: string;
}

export interface MeasurementDescription {
  measurementCode: string;
  measurementShortDesc: string;
  label: string;
}

interface MeasurementOption {
  measurementCode: string;
  measurementShortDesc: string;
  label: string;
}

@Component({
  selector: 'app-measurement-target-manager',
  templateUrl: './measurement-target-manager.component.html',
  styleUrls: ['./measurement-target-manager.component.scss']
})
export class MeasurementTargetManagerComponent implements OnInit {
  displayedColumns: string[] = ['measurementCode', 'measurementShortDesc', 'mYear', 'mTarget', 'entryUser', 'entryDate', 'actions'];
  dataSource = new MatTableDataSource<MeasurementTarget>();
  measurementDescriptions: { [code: string]: string } = {};
  measurementOptions: MeasurementOption[] = [];
  loginUserName: string = '';
  filterValue: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private authenticationService: AuthenticationService) {}

  ngOnInit(): void {
    // load independent data
    this.loadDescriptions();
    this.loadTargets();

    // get authenticated user (used on save)
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

    // dropdown options
    this.http
      .get<MeasurementOption[]>(`${environment.apiUrl}/MeasurementDataMoshe/GetMeasurementsCodeAndShortDesc`)
      .subscribe((data) => {
        // if backend still returns caps, normalize defensively
        this.measurementOptions = data.map((d: any) => ({
          measurementCode: d.measurementCode ?? d.MeasurementCode,
          measurementShortDesc: d.measurementShortDesc ?? d.MeasurementShortDesc,
          label: d.label ?? d.Label
        }));
      });

    // filter predicate
    this.dataSource.filterPredicate = (data: MeasurementTarget, filter: string): boolean => {
      const shortDesc = this.getShortDesc(data.measurementCode);
      const combined = (
        data.measurementCode +
        shortDesc +
        (data.mYear ?? '') +
        (data.mTarget ?? '') +
        (data.entryUser ?? '')
      )
        .toString()
        .toLowerCase();

      return combined.includes(filter.trim().toLowerCase());
    };
  }

  loadDescriptions(): void {
    this.http
      .get<MeasurementDescription[]>(`${environment.apiUrl}/MeasurementDataMoshe/GetMeasurementsCodeAndShortDesc`)
      .subscribe((descs: any[]) => {
        // normalize just in case
        const normalized = descs.map((d) => ({
          measurementCode: d.measurementCode ?? d.MeasurementCode,
          measurementShortDesc: d.measurementShortDesc ?? d.MeasurementShortDesc,
          label: d.label ?? d.Label
        })) as MeasurementDescription[];

        this.measurementDescriptions = normalized.reduce((acc, curr) => {
          acc[curr.measurementCode] = curr.measurementShortDesc;
          return acc;
        }, {} as { [code: string]: string });
      });
  }

  loadTargets(): void {
    this.http
      .get<MeasurementTarget[]>(`${environment.apiUrl}/MeasurementDataMoshe/GetMeasurementTargets`)
      .subscribe((data: any[]) => {
        // normalize to lowercase fields
        const normalized = data.map((r) => ({
          measurementCode: r.measurementCode ?? r.MeasurementCode,
          mYear: r.mYear ?? r.MYear,
          mTarget: r.mTarget ?? r.MTarget,
          entryUser: r.entryUser ?? r.EntryUser,
          entryDate: r.entryDate ?? r.EntryDate
        })) as MeasurementTarget[];

        this.dataSource.data = normalized;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      });
  }

  getShortDesc(code: string): string {
    return this.measurementDescriptions[code] || '';
  }

  saveTarget(row: MeasurementTarget): void {
    // map back to API’s expected keys (CamelCase) if needed
    const payload = {
      MeasurementCode: row.measurementCode,
      MYear: row.mYear,
      MTarget: row.mTarget,
      EntryUser: this.loginUserName
    };

    this.http.post(`${environment.apiUrl}/MeasurementDataMoshe/UpsertMeasurementTarget`, payload).subscribe(
      () => {
        alert('✅ עודכן בהצלחה');
      },
      () => {
        alert('❌ שגיאה בעדכון');
      }
    );
  }

  addNewRow(): void {
    const newRow: MeasurementTarget & { isNew?: boolean } = {
      measurementCode: '',
      mYear: new Date().getFullYear(),
      mTarget: null,
      isNew: true
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
