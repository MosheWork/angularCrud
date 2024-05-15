import { Component, OnInit ,Input} from '@angular/core';
import { environment } from 'environments/environment';
import { Router } from '@angular/router';



@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  loginUserName = '';
  @Input() title: string = '';  // Default title, can be overridden
  @Input() guideCount: number = 0;  // Add input for guide count

  constructor(private router: Router) { }  // Inject the Router here

  ngOnInit(): void {
    this.loginUserName = localStorage.getItem('loginUserName') || '';

  }
  goToGuidesList() {
    this.router.navigate(['/GuidesList']); // Update '/guides' to your GuidesList route path
  }
}
