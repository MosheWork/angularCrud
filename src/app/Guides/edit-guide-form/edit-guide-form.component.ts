import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from 'environments/environment';

interface Section {
  type: string;
  position: number;
  content: string;
  preview?: string;
  createdBy: string; // Add createdBy property
}

interface Guide {
  title: string;
  createdBy: string;
  sections: Section[];
}
interface Picture {
  imagePath: string;
  position: number;
  createdBy: string; // Add createdBy property
}

interface TextSection {
  textContent: string;
  position: number;
  createdBy: string; // Add createdBy property
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

  fetchGuide(id: number): void {
    this.http.get<GuideData>(`${environment.apiUrl}GuidesAPI/${id}`).subscribe({
      next: (data) => {
        this.guide.title = data.title;
        this.guide.createdBy = data.createdBy;
        this.guide.sections = [
          ...data.pictures.map(picture => ({
            type: 'image',
            content: picture.imagePath,
            position: picture.position,
            preview: this.transformImagePath(picture.imagePath),
            createdBy: data.createdBy  // Add the createdBy property for images
          })),
          ...data.textSections.map(text => ({
            type: 'text',
            content: text.textContent,
            position: text.position,
            createdBy: data.createdBy  // Add the createdBy property for text sections
          }))
        ].sort((a, b) => a.position - b.position);
      },
      error: (error) => console.error('Error fetching guide:', error)
    });
}


  transformImagePath(imagePath: string): string {
    const parts = imagePath.split('\\');
    const fileName = parts.pop();
    return fileName ? `${environment.imageBaseUrl}${parts.join('/')}/${encodeURIComponent(fileName)}` : '';
  }

  addTextSection(): void {
    this.guide.sections.push({ type: 'text', content: '', position: this.guide.sections.length, createdBy: '' });
  }
  
  addImageSection(): void {
    this.guide.sections.push({ type: 'image', content: '', position: this.guide.sections.length, createdBy: '' });
  }
  
  removeSection(index: number): void {
    this.guide.sections.splice(index, 1);
  }

  handleImageChange(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.guide.sections[index].preview = e.target.result;
        this.guide.sections[index].content = file; // Store the File object for upload
      };
      reader.readAsDataURL(file);
    }
  }

  moveSectionUp(index: number): void {
    if (index > 0) {
      [this.guide.sections[index - 1], this.guide.sections[index]] = [this.guide.sections[index], this.guide.sections[index - 1]];
    }
  }

  moveSectionDown(index: number): void {
    if (index < this.guide.sections.length - 1) {
      [this.guide.sections[index + 1], this.guide.sections[index]] = [this.guide.sections[index], this.guide.sections[index + 1]];
    }
  }

  submitForm(): void {
    const updateData = {
      title: this.guide.title,
      createdBy: this.guide.createdBy,
      pictures: this.guide.sections.filter(s => s.type === 'image').map((s, i) => ({
        imagePath: s.content,
        position: i,
        createdBy: s.createdBy  // Include createdBy for each picture
      })) as Picture[],
      textSections: this.guide.sections.filter(s => s.type === 'text').map((s, i) => ({
        textContent: s.content,
        position: i,
        createdBy: s.createdBy  // Include createdBy for each text section
      })) as TextSection[]
    };
    if (updateData.pictures.length === 0) {
      updateData.pictures = null as unknown as Picture[];
    }
  
    if (updateData.textSections.length === 0) {
      updateData.textSections = null as unknown as TextSection[];
    }
  
    console.log('Submitting updateData:', updateData);
  
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
