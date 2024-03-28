import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-service-calls-screen-it',
  templateUrl: './service-calls-screen-it.component.html',
  styleUrls: ['./service-calls-screen-it.component.scss']
})
export class ServiceCallsScreenITComponent implements OnInit {
  serviceCalls: any[] = [];

  constructor(private http: HttpClient) {}

  displayedColumns: string[] = [];

  ngOnInit(): void {
  }
  

}
