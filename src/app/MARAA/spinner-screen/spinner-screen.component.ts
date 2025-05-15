import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../../../app/services/authentication-service/authentication-service.component';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';


@Component({
  selector: 'app-spinner-screen',
  templateUrl: './spinner-screen.component.html',
  styleUrls: ['./spinner-screen.component.scss']
})
export class SpinnerScreenComponent implements OnInit {
  UserName: string = '';
  profilePictureUrl: string = 'assets/default-user.png'; // default profile picture
  backgroundImageUrl: string = 'assets/back1.jpg';

  constructor(
    private authenticationService: AuthenticationService,
    private http: HttpClient,private router: Router
  ) {}

  ngOnInit(): void {
    this.authenticationService.getAuthentication().subscribe(
      (response) => {
        const user = response.message.split('\\')[1];
        this.getUserDetailsFromDBByUserName(user.toUpperCase());
      },
      (error) => {
        console.error('Authentication failed:', error);
      }
    );
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
  getUserDetailsFromDBByUserName(username: string): void {
    this.http.get<any>(`${environment.apiUrl}ServiceCRM/GetEmployeeInfo?username=${username}`)
      .subscribe(
        (data) => {
          this.UserName = data.UserName;
          this.profilePictureUrl = data.ProfilePicture || 'assets/default-user.png';
        },
        (error) => {
          console.error('Error fetching user details:', error);
        }
      );
  }
}
