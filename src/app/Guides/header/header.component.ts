import { Component, OnInit } from '@angular/core';
import { environment } from 'environments/environment';
import { Router } from '@angular/router';



@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  loginUserName = '';

  constructor(private router: Router) { }  // Inject the Router here

  ngOnInit(): void {
    this.loginUserName = localStorage.getItem('loginUserName') || '';

  }
  goToGuidesList() {
    this.router.navigate(['/GuidesList']); // Update '/guides' to your GuidesList route path
  }
}
