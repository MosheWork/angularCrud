import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';

interface Guide {
  title: string;
  createdBy: string;
  createdDate: Date;
  sections: Section[];
}

interface Section {
  position: number;
  textContent?: string;
  imagePath?: string;
  type?: string;
}

@Component({
  selector: 'app-view-guide',
  templateUrl: './view-guide.component.html',
  styleUrls: ['./view-guide.component.scss']
})
export class ViewGuideComponent implements OnInit {
  guide!: Guide;
  guideItems: Section[] = [];

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
    this.http.get<any>(`${environment.apiUrl}GuidesAPI/GetGuide/${id}`).subscribe(
      data => {
        this.guide = data.guide;
        this.guideItems = data.sections;
        console.log('Guide data:', this.guide);
        console.log('Sections data:', this.guideItems);
      },
      error => {
        console.error('There was an error fetching the guide:', error);
      }
    );
  }

  transformImagePath(imagePath?: string): string {
    if (!imagePath) {
        console.error('No imagePath provided');
        return ''; // Return a default or empty string if no path provided
    }

    const parts = imagePath.split('\\');
    const filename = parts.pop(); // Extract the last element as the file name

    if (!filename) {
        console.error('Filename extraction failed from imagePath');
        return ''; // Return an empty string if filename is undefined
    }

    const encodedFilename = encodeURIComponent(filename); // Safely encode the filename
    const baseUrl = `${environment.imageBaseUrl}`; // Removed the extra slash here
    const fullUrl = `${baseUrl}/${encodedFilename}`; // Construct the full URL

    // Log the final URL to verify it's correct
    console.log('Generated image URL:', fullUrl);

    return fullUrl;
}


  
  
  
  
  
  
  
  
}
