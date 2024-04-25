import { Component, OnInit } from '@angular/core';
import { environment } from '../../environments/environment';


@Component({
  selector: 'app-admin-home-page',
  templateUrl: './admin-home-page.component.html',
  styleUrls: ['./admin-home-page.component.scss']
})
export class AdminHomePageComponent implements OnInit {

  links = [
    { title: 'מסך מנהל-קריאות', description: '', url: 'http://localhost:4200/AdminDashboard', imageUrl: './../../assets/AdminDashboard.jpg' },
    { title: 'ניהול הרשאות לדוחות', description: '', url: 'http://localhost:4200/reports-permissions', imageUrl: './../../assets/reports-permissions.jpg' },
    { title: 'מערכת קריאות', description: '', url: 'http://localhost:4200/MainServiceCallsScreen', imageUrl: './../../assets/מערכת קריאות.jpg' },
    // Add more projects as needed
  ];

  navigate(url: string): void {
    window.open(url, '_blank');
}
  constructor() { }

  ngOnInit(): void {
  }

}
