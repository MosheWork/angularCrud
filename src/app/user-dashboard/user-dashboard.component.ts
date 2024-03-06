import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs'; // Import 'of' to handle cases where you don't need to make an HTTP call
import { interval, switchMap,startWith } from 'rxjs';

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.scss']
})
export class UserDashboardComponent implements OnInit {
  loginUserName = '';
  userData: any = {};
  previousOpenCalls: number | null = null;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.loginUserName = localStorage.getItem('loginUserName') || '';
    interval(60000) // 60000 milliseconds = 1 minute
      .pipe(
        startWith(0),
        switchMap(() => this.fetchUserData(this.loginUserName)) // Adjusted to pass loginUserName
      )
      .subscribe(data => {
        
        // This assumes your backend returns the data in the format you expect for userData
        this.userData = data;
        this.checkForNewServiceCall(this.userData.open_calls);
      });

      
  }

  fetchUserData(userName: string): Observable<any> {
    if (!userName) {
      return of({}); // Return an empty object wrapped in an Observable if userName is falsy
    }
    const url = `http://localhost:7144/api/UsersDashboardAPI/${userName}`;
    return this.http.get(url); // Directly return the Observable from the HTTP GET request
  }

  checkForNewServiceCall(openCalls: string) {
    const currentOpenCalls = parseInt(openCalls, 10);
    if (this.previousOpenCalls !== null && currentOpenCalls > this.previousOpenCalls) {
      alert('New service call received!');
    }
    this.previousOpenCalls = currentOpenCalls;
  }
}
