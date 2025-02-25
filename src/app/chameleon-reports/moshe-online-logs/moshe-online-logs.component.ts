import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-moshe-online-logs',
  templateUrl: './moshe-online-logs.component.html',
  styleUrls: ['./moshe-online-logs.component.scss']
})
export class MosheOnlineLogsComponent implements OnInit {


  // Table 1: Request Count Per Controller
  requestCountColumns: string[] = ['ControllerName', 'RequestCount'];
  requestCountData: any[] = [];
  isLoadingRequestCount = true;

  // Table 2: Detailed Online Logs
  logColumns: string[] = ['RequestTime', 'RequestUrl', 'HttpMethod', 'UserIP'];
  logsData: any[] = [];
  isLoadingLogs = true;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchRequestCountPerController();
    this.fetchOnlineLogs();
  }

  fetchRequestCountPerController() {
    this.http.get<any[]>(`${environment.apiUrl}MosheOnlineLogsAPI/GetRequestCountPerController`).subscribe(
      (data) => {
        this.requestCountData = data;
        this.isLoadingRequestCount = false;
      },
      (error) => {
        console.error('Error fetching request count per controller', error);
        this.isLoadingRequestCount = false;
      }
    );
  }

  fetchOnlineLogs() {
    this.http.get<any[]>(`${environment.apiUrl}MosheOnlineLogsAPI/GetOnlineLogs`).subscribe(
      (data) => {
        this.logsData = data;
        this.isLoadingLogs = false;
      },
      (error) => {
        console.error('Error fetching logs', error);
        this.isLoadingLogs = false;
      }
    );
  }
}
