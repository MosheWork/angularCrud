import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';

@Component({
  selector: 'app-view-guide',
  templateUrl: './view-guide.component.html',
  styleUrls: ['./view-guide.component.scss']
})
export class ViewGuideComponent implements OnInit {
  guide: any; // Property to hold the fetched guide data
  guideItems: any[] = []; // An array to hold both text and pictures, sorted by position

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef // Add ChangeDetectorRef to constructor
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      this.fetchGuide(id);
    });
  }

  fetchGuide(id: number): void {
    this.http.get<any>(`${environment.apiUrl}GuidesAPI/${id}`).subscribe(
      data => {
        this.guide = data;
        this.guideItems = [...data.textSections, ...data.pictures].map(item => {
          // Assign a type based on the presence of 'imagePath' or 'textContent'
          if (item.imagePath) {
            item.type = 'picture';
            this.transformImagePath(item);
          } else if (item.textContent) {
            item.type = 'text';
          }
          return item;
        });
        this.guideItems.sort((a, b) => a.position - b.position);
      },
      error => {
        console.error('There was an error fetching the guide:', error);
      }
    );
  }
  
  transformImagePath(item: any): void {
    const parts = item.imagePath.split('\\'); // Assuming Windows paths from your server
    const fileName = parts.pop(); // Get the filename part
    const encodedFileName = encodeURIComponent(fileName); // Encode only the filename
    const fullPath = parts.join('/') + '/' + encodedFileName; // Reconstruct the full path with encoded filename
    item.imagePath = `${environment.imageBaseUrl}${fullPath}`; // Update the imagePath with the full, encoded path
  }
}
