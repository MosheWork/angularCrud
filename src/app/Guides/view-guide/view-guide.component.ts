import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment'; // Ensure this path is correct

@Component({
  selector: 'app-view-guide',
  templateUrl: './view-guide.component.html',
  styleUrls: ['./view-guide.component.scss']
})
export class ViewGuideComponent implements OnInit {
  guide: any;  // Define the type based on your data model or use any to start with

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute
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
        this.transformImagePaths(this.guide); // Adjust image paths
      },
      error => {
        console.error('There was an error fetching the guide:', error);
      }
    );
  }

  transformImagePaths(guide: any): void {
    if (guide && guide.pictures) {
      guide.pictures = guide.pictures.map((pic: any) => {
        const parts = pic.imagePath.split('\\'); // Assuming Windows paths from your server
        const fileName = parts.pop(); // Get the filename part
        const encodedFileName = encodeURIComponent(fileName); // Encode only the filename
        const fullPath = parts.join('/') + '/' + encodedFileName; // Reconstruct the full path with encoded filename
        return {
          ...pic,
          imagePath: `${environment.imageBaseUrl}${fullPath}` // Use the reconstructed, correctly encoded path
        };
      });
    }
  }
  
  
  
}
