import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AnimationOptions } from 'ngx-lottie';
import { AuthenticationService } from '../../services/authentication-service/authentication-service.component';





@Component({
  selector: 'app-birthday-update-crm',
  templateUrl: './birthday-update-crm.component.html',
  styleUrls: ['./birthday-update-crm.component.scss']
})
export class BirthdayUpdateCRMComponent implements OnInit, AfterViewInit {

  
  displayedColumns: string[] = [
    'CaseNumber', 'DepartmentName', 'EnterDepartDate', 'EnterDepartTime',
    'ExitHospTime', 'FirstName', 'LastName', 'Telephone', 'Mobile',
    'BirthDate', 'IsBirthday', 'BirthdayUpdate', 'BirthdayUpdateDate'
    
  ];
  // lottieOptions: AnimationOptions = {
  //   path: 'https://lottie.host/51282cb2-c567-4af2-9999-2acb6364123c/yAr1WZHFmw.lottie'
  // };
  lottieOptions: AnimationOptions = {
    path: 'assets/Animation - 1743597295278.json',
    autoplay: true,
    loop: true
  };

  currentUsername: string = '';
  UserName: string = ''; // 👈 ADD THIS LINE


  animationCreated(animationItem: any): void {
    console.log('🎉 Birthday Lottie animation started');
  }
  dataSource = new MatTableDataSource<any>([]);
  isLoading = true;
  showLottie: boolean = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private authService: AuthenticationService) {}

  ngOnInit(): void {
    this.authService.getAuthentication().subscribe(
      (response) => {
        console.log('✅ Authentication Successful:', response.message);
        let user = response.message.split('\\')[1];
        console.log('🧑 User:', user);
        this.currentUsername = user.toUpperCase(); // Save to use later when sending payload
        this.fetchData();
      },
      (error) => {
        console.error('❌ Authentication Failed:', error);
      }
    );
    this.fetchData();

  }

  fetchData(): void {
    this.isLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}ServiceCRM/BirthdayPatientsPast72h`).subscribe(data => {
      this.dataSource.data = data.map(item => ({
        ...item,
        EnterDepartDate: item.EnterDepartDate ? new Date(item.EnterDepartDate) : null,
        BirthDate: item.BirthDate ? new Date(item.BirthDate) : null
      }));
      this.isLoading = false;

      setTimeout(() => {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      });
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }


  onBirthdayToggle(row: any, event: any): void {
    const isChecked = event.checked;
  
    const confirmMsg = isChecked
      ? 'האם אתה בטוח שברצונך לעדכן למזל טוב?'
      : 'האם אתה בטוח שברצונך להסיר את סטטוס היומולדת?';
  
    if (confirm(confirmMsg)) {
      const payload = {
        CaseNumber: row.CaseNumber,
        BirthdayUpdate: isChecked ? 'yes' : null,
        BirthdayUserUpdate: isChecked ? this.currentUsername : null // 👈 Send username!
      };
  
      this.http.post(`${environment.apiUrl}ServiceCRM/UpdateBirthday`, payload).subscribe(() => {
        this.fetchData();
  
        if (isChecked) {
          console.log('🎉 Triggering balloon animation');
          this.showLottie = true;
          setTimeout(() => this.showLottie = false, 5000);
        }
      });
    } else {
      event.source.checked = !isChecked;
    }
  }
  
  
  
  
  getUserDetailsFromDBByUserName(username: string): void {
    this.http.get<any>(`${environment.apiUrl}ServiceCRM/GetEmployeeInfo?username=${username}`).subscribe(
      (data) => {
        this.UserName = data.UserName;
      },
      (error) => {
        console.error('Error fetching employee info:', error);
      }
    );
  }
  
}
