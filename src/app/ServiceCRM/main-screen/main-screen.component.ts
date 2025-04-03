import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../../../app/services/authentication-service/authentication-service.component';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-main-screen',
  templateUrl: './main-screen.component.html',
  styleUrls: ['./main-screen.component.scss']
})
export class MainScreenComponent implements OnInit {
  userName: string = '';
  profilePicture: string = ''; // URL or base64
  backgroundImageUrl: string = 'assets/back1.jpg';
  birthdayImageUrl: string = 'assets/birthday.jpg';


  profilePictureUrl: string = 'assets/default-user.png'; // fallback default
  constructor(private authenticationService: AuthenticationService, private http: HttpClient) {}

  ngOnInit(): void {
    this.authenticationService.getAuthentication().subscribe(
      (response) => {
        console.log('✅ Authentication Successful:', response.message);
        let user = response.message.split('\\')[1];
        console.log('🧑 User:', user);
        this.getUserDetailsFromDBByUserName(user.toUpperCase());
      },
      (error) => {
        console.error('❌ Authentication Failed:', error);
      }
    );
  }

  getUserDetailsFromDBByUserName(username: string): void {
    this.http.get<any>(`${environment.apiUrl}ServiceCRM/GetEmployeeInfo?username=${username.toUpperCase()}`)
  .subscribe(
    (data) => {
      this.userName = data.userName;
      this.profilePictureUrl = `assets/profile/${data.ProfilePicture}`; // adjust path if needed
    },
    (error) => {
      console.error('Error fetching employee info:', error);
    }
  );

  }

  navigate(link: string): void {
    window.location.href = link;
  }
}
