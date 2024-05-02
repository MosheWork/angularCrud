import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from 'environments/environment';

interface Section {
  type: string;
  position: number;
  content: string;
  preview?: string;  // Assuming preview is an optional string
}
interface ImageItem {
  imagePath: string;
}
interface Guide {
  title: string;
  createdBy: string;
  sections: Section[];
}
interface Picture {
  imagePath: string;
  position: number;
}

interface TextSection {
  textContent: string;
  position: number;
}

interface GuideData {
  title: string;
  createdBy: string;
  createdDate: string;
  guideId: number;
  lastUpdated: string;
  status?: any;
  description?: string | null;
  pictures: Picture[];
  textSections: TextSection[];
}

@Component({
  selector: 'app-edit-guide-form',
  templateUrl: './edit-guide-form.component.html',
  styleUrls: ['./edit-guide-form.component.scss']
})
export class EditGuideFormComponent implements OnInit {
  guideId!: number;
  title: string = '';
  createdBy: string = '';
  sections: Section[] = [];
  guide: Guide = {
    title: '',
    createdBy: '',
    
    sections: []
  };

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.guideId = +params['id'];
      this.fetchGuide(this.guideId);
    });
  }

  transformImagePath(imagePath: string): string {
    const parts = imagePath.split('\\');
    const fileName = parts.pop();
    if (!fileName) return ''; // Handle undefined filename
    const encodedFileName = encodeURIComponent(fileName);
    const fullPath = parts.join('/') + '/' + encodedFileName;
    return `${environment.imageBaseUrl}${fullPath}`;
  }

  fetchGuide(id: number): void {
    this.http.get<GuideData>(`${environment.apiUrl}GuidesAPI/${id}`).subscribe({
      next: (data) => {
        // Assign title, createdBy, and createdDate from the fetched data
        this.title = data.title;
        this.createdBy = data.createdBy;
  
        // Continue handling sections
        this.sections = [
          ...data.pictures.map(picture => ({
            type: 'image',
            content: picture.imagePath,
            position: picture.position,
            preview: this.transformImagePath(picture.imagePath) // Convert file path for web use
          })),
          ...data.textSections.map(text => ({
            type: 'text',
            content: text.textContent,
            position: text.position,
            preview: '' // Text sections typically don't have an image preview
          }))
        ].sort((a, b) => a.position - b.position); // Ensure sections are sorted by their position
  
        // Optional: Log the complete guide object to debug
        console.log("Complete guide data:", {
          title: this.title,
          createdBy: this.createdBy,
          sections: this.sections
        });
      },
      error: (error) => {
        console.error('Error fetching guide:', error);
      }
    });
  }
  

  
  
  getImageUrl(path: string): string {
    const basePath = environment.apiUrl.endsWith('/') ? environment.apiUrl.slice(0, -1) : environment.apiUrl;
    const newPath = path.replace(/\\/g, '/');
    return `${basePath}/path/to/images/${encodeURIComponent(newPath)}`;
  }
  
  

  addTextSection(): void {
    this.guide.sections.push({ type: 'text', content: '', position: this.guide.sections.length });
  }

  addImageSection(): void {
    this.guide.sections.push({ type: 'image', content: '', position: this.guide.sections.length, preview: undefined });
  }

  removeSection(index: number): void {
    this.guide.sections.splice(index, 1);
  }

  handleImageChange(event: any, index: number) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.sections[index].preview = e.target.result;
        this.sections[index].content = file;  // Store the File object for upload
      };
      reader.readAsDataURL(file);
    }
  }
  

  moveSectionUp(index: number): void {
    if (index > 0) {
      const temp = this.guide.sections[index - 1];
      this.guide.sections[index - 1] = this.guide.sections[index];
      this.guide.sections[index] = temp;
    }
  }

  moveSectionDown(index: number): void {
    if (index < this.guide.sections.length - 1) {
      const temp = this.guide.sections[index + 1];
      this.guide.sections[index + 1] = this.guide.sections[index];
      this.guide.sections[index] = temp;
    }
  }

  submitForm(): void {
    const updateData = {
      title: this.guide.title,
      createdBy: this.guide.createdBy,
      pictures: this.guide.sections.filter(s => s.type === 'image').map((s, i) => ({
        imagePath: s.content,
        position: i
      })),
      textSections: this.guide.sections.filter(s => s.type === 'text').map((s, i) => ({
        textContent: s.content,
        position: i
      }))
    };

    this.http.put(`${environment.apiUrl}GuidesAPI/${this.guideId}`, updateData).subscribe({
      next: (response) => {
        console.log('Guide updated successfully:', response);
        this.router.navigate(['/guides']);  // Adjust as necessary for your routing
      },
      error: (error) => {
        console.error('Failed to update guide:', error);
      }
    });
  }

}
