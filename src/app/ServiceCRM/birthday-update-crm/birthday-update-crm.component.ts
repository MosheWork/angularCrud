import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AnimationOptions } from 'ngx-lottie';
import { AuthenticationService } from '../../services/authentication-service/authentication-service.component';

interface BirthdayRow {
  caseNumber: string;
  departmentName: string;
  enterDepartDate: Date | null;
  enterDepartTime: string | null;
  exitHospTime: string | null;
  firstName: string;
  lastName: string;
  telephone: string;
  mobile: string;
  birthDate: Date | null;
  isBirthday: boolean;
  birthdayUpdate: 'yes' | null;
  birthdayUpdateDate: Date | null;
}

@Component({
  selector: 'app-birthday-update-crm',
  templateUrl: './birthday-update-crm.component.html',
  styleUrls: ['./birthday-update-crm.component.scss']
})
export class BirthdayUpdateCRMComponent implements OnInit, AfterViewInit {

  // ✅ Use lower-camel everywhere in the UI
  displayedColumns: string[] = [
    'caseNumber', 'departmentName', 'enterDepartDate', 'enterDepartTime',
    'exitHospTime', 'firstName', 'lastName', 'telephone', 'mobile',
    'birthDate', 'isBirthday', 'birthdayUpdate', 'birthdayUpdateDate'
  ];

  // 🎈 Lottie
  lottieOptions: AnimationOptions = {
    path: 'assets/Animation - 1743597295278.json',
    autoplay: true,
    loop: true
  };

  currentUsername: string = '';
  showLottie = false;

  dataSource = new MatTableDataSource<BirthdayRow>([]);
  isLoading = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private authService: AuthenticationService) {}

  ngOnInit(): void {
    // get username (for audit fields)
    this.authService.getAuthentication().subscribe(
      (response) => {
        const user = response.message.split('\\')[1] || '';
        this.currentUsername = user.toUpperCase();
        this.fetchData();
      },
      () => this.fetchData() // still fetch data even if auth fails
    );
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.paginator) this.dataSource.paginator = this.paginator;
      if (this.sort) this.dataSource.sort = this.sort;
    });
  }

  private normalize(item: any): BirthdayRow {
    // Accept both lowerCamel and PascalCase from backend, convert dates
    const enterDepartDate = item.enterDepartDate ?? item.EnterDepartDate ?? null;
    const birthDate = item.birthDate ?? item.BirthDate ?? null;
    const birthdayUpdateDate = item.birthdayUpdateDate ?? item.BirthdayUpdateDate ?? null;

    return {
      caseNumber: item.caseNumber ?? item.CaseNumber ?? '',
      departmentName: item.departmentName ?? item.DepartmentName ?? '',
      enterDepartDate: enterDepartDate ? new Date(enterDepartDate) : null,
      enterDepartTime: item.enterDepartTime ?? item.EnterDepartTime ?? null,
      exitHospTime: item.exitHospTime ?? item.ExitHospTime ?? null,
      firstName: item.firstName ?? item.FirstName ?? '',
      lastName: item.lastName ?? item.LastName ?? '',
      telephone: item.telephone ?? item.Telephone ?? '',
      mobile: item.mobile ?? item.Mobile ?? '',
      birthDate: birthDate ? new Date(birthDate) : null,
      isBirthday: (item.isBirthday ?? item.IsBirthday ?? false) as boolean,
      birthdayUpdate: (item.birthdayUpdate ?? item.BirthdayUpdate ?? null) as 'yes' | null,
      birthdayUpdateDate: birthdayUpdateDate ? new Date(birthdayUpdateDate) : null,
    };
  }

  fetchData(): void {
    this.isLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}ServiceCRM/BirthdayPatientsPast72h`).subscribe({
      next: (data) => {
        this.dataSource.data = data.map(d => this.normalize(d));
        this.isLoading = false;

        setTimeout(() => {
          if (this.paginator) this.dataSource.paginator = this.paginator;
          if (this.sort) this.dataSource.sort = this.sort;
        }, 0);

        // robust global filter (handles Dates too)
        this.dataSource.filterPredicate = (row: BirthdayRow, filter: string) => {
          const values = Object.values(row).map(v =>
            v instanceof Date ? v.toISOString() : (v ?? '').toString()
          );
          return values.join(' ').toLowerCase().includes(filter);
        };
      },
      error: () => (this.isLoading = false)
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
    this.dataSource.paginator?.firstPage();
  }

  onBirthdayToggle(row: BirthdayRow, event: any): void {
    const isChecked = !!event.checked;

    const confirmMsg = isChecked
      ? 'האם אתה בטוח שברצונך לעדכן למזל טוב?'
      : 'האם אתה בטוח שברצונך להסיר את סטטוס היומולדת?';

    if (!confirm(confirmMsg)) {
      // revert UI toggle
      event.source.checked = !isChecked;
      return;
    }

    // ✅ Send both lowerCamel and PascalCase keys for backwards compatibility
    const payload: any = {
      caseNumber: row.caseNumber,
      birthdayUpdate: isChecked ? 'yes' : null,
      birthdayUserUpdate: isChecked ? this.currentUsername : null,

      // legacy duplicates (safe to include)
      CaseNumber: row.caseNumber,
      BirthdayUpdate: isChecked ? 'yes' : null,
      BirthdayUserUpdate: isChecked ? this.currentUsername : null
    };

    this.http.post(`${environment.apiUrl}ServiceCRM/UpdateBirthday`, payload).subscribe(() => {
      this.fetchData();

      if (isChecked) {
        this.showLottie = true;
        setTimeout(() => (this.showLottie = false), 5000);
      }
    });
  }

  animationCreated(animationItem: any): void {
    // optional logging
    // console.log('🎉 Birthday Lottie animation started', animationItem);
  }
}
