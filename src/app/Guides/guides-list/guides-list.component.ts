import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router'; // Import Angular Router
import { environment } from 'environments/environment';

@Component({
  selector: 'app-guides-list',
  templateUrl: './guides-list.component.html',
  styleUrls: ['./guides-list.component.scss'],
})
export class GuidesListComponent implements OnInit {
  guides: any[] = []; // Assuming the structure of guides returned from the API

  constructor(
    private http: HttpClient,
    private router: Router // Inject Angular Router
  ) {}

  ngOnInit(): void {
    this.fetchGuides();
    document.title = 'רשימת מדריכים';

  }

  fetchGuides(): void {
    this.http.get<any[]>(environment.apiUrl + 'GuidesAPI').subscribe(
      (guides) => {
        this.guides = guides;
   
      },
      (error) => {
        console.error('Error fetching guides:', error);
      }
    );
  }

  navigateToNewGuide(): void {
    this.router.navigate(['/new-guide']); // Navigate to NewGuideFormComponent
  }

  openGuide(id: number): void {
    this.router.navigate(['/guide/', id]);
  }

  editGuide(id: number): void {
    this.router.navigate(['/Editguide', id]);  // Assume you have a route setup for editing
  }
}
