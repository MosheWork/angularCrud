import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';
@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private apiUrl = environment.AuthUrl+'Authentication';//'http://srv-apps-prod:47001/AutoAuthentication';
   
  url = this.apiUrl;

  constructor(private http: HttpClient) {}

  getAuthentication(): Observable<any> {
    
  
    return this.http.get(this.apiUrl, {
      withCredentials: true, // Include credentials (e.g., cookies, auth headers)
    });
  }
}