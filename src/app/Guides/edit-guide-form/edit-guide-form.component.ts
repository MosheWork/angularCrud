import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpHeaders } from '@angular/common/http';

import { environment } from 'environments/environment';

interface Section {
  type: string;
  content?: string | null;  // Allow null values for content
  position: number;
  preview?: string;
}
interface TextSection {
  textContent: string;
  position: number;
}

interface Picture {
  imagePath: string;
  position: number;
}

interface GuideData {
  title: string;
  createdBy: string;
  textSections: TextSection[];
  pictures: Picture[];
}


@Component({
  selector: 'app-edit-guide-form',
  templateUrl: './edit-guide-form.component.html',
  styleUrls: ['./edit-guide-form.component.scss'],
})
export class EditGuideFormComponent implements OnInit {
  title: string = '';
  createdBy: string = '';
  sections: Section[] = [];
  guideId?: number;  // Mark guideId as optional

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    document.title = ' עריכת מדריך';

    this.route.params.subscribe(params => {
      this.guideId = +params['id']; // Ensure conversion to number
      if (this.guideId) {
        this.loadGuide(this.guideId);
      }
    });
  }

  loadGuide(id: number) {
    this.http.get<GuideData>(`${environment.apiUrl}GuidesAPI/${id}`).subscribe(
      guide => {
        this.title = guide.title;
        this.createdBy = guide.createdBy;
        this.sections = [
          ...guide.textSections.map(ts => ({
            type: 'text',
            content: ts.textContent,
            position: ts.position
          })),
          ...guide.pictures.map(pic => {
            const transformedPath = this.transformImagePath(pic.imagePath);
            return { type: 'image', content: transformedPath, preview: transformedPath, position: pic.position };
          })
        ].sort((a, b) => a.position - b.position);
      },
      error => {
        console.error('Failed to load guide:', error);
      }
    );
  }
  transformImagePath(imagePath: string): string {
    const parts = imagePath.split('\\'); // Assuming Windows paths from your server
    const fileName = parts.pop(); // Get the filename part

    // Check if fileName is defined before encoding
    if (fileName === undefined) {
        console.error('Filename is undefined:', imagePath);
        return ''; // Return a default or handled path
    }

    const encodedFileName = encodeURIComponent(fileName); // Encode only the filename
    const fullPath = parts.join('/') + '/' + encodedFileName; // Reconstruct the full path with encoded filename
    return `${environment.imageBaseUrl}${fullPath}`;
}


 

  addTextSection() {
    this.sections.push({
      type: 'text',
      content: '',
      position: this.sections.length + 1,
    });
  }

  addImageSection() {
    this.sections.push({
      type: 'image',
      content: null,  // Now correctly typed as string | null
      position: this.sections.length + 1,
    });
  }

  moveSectionUp(index: number) {
    if (index > 0) {
      [this.sections[index], this.sections[index - 1]] = [this.sections[index - 1], this.sections[index]];
      this.recalculatePositions();
    }
  }

  moveSectionDown(index: number) {
    if (index < this.sections.length - 1) {
      [this.sections[index], this.sections[index + 1]] = [this.sections[index + 1], this.sections[index]];
      this.recalculatePositions();
    }
  }

  recalculatePositions() {
    this.sections.forEach((section, index) => {
      section.position = index + 1;
    });
  }

  handleImageChange(event: any, index: number) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => this.sections[index].preview = e.target.result;
      reader.readAsDataURL(file);
    }
  }

  removeSection(index: number) {
    this.sections.splice(index, 1);
    this.recalculatePositions();
  }
  submitForm() {
    if (!this.guideId) {
      console.error('Guide ID is undefined.');
      return;
    }
  
    const formData = new FormData();
    formData.append('title', this.title);
    formData.append('createdBy', this.createdBy);
  
    this.sections.forEach((section, index) => {
      if (section.type === 'text') {
        formData.append(`textContents[${index}]`, section.content || '');
        formData.append(`textPositions[${index}]`, String(section.position));
      } else if (section.type === 'image') {
        const content: File | string | null | undefined = section.content;
  
        if (content !== null && typeof content !== 'string' && content !== undefined) {
          // content is a File
          formData.append(`images`, content, (content as File).name); // Ensure content is of type File before accessing its name property
          formData.append(`imagePositions[${index}]`, String(section.position));
        } else if (typeof content === 'string') {
          // content is a string (image path)
          formData.append(`imagePaths[${index}]`, content);
          formData.append(`imagePositions[${index}]`, String(section.position));
        }
      }
    });
  
    // Removed the set header line
    this.http.put(`${environment.apiUrl}GuidesAPI/${this.guideId}`, formData).subscribe(
      response => {
        console.log('Guide updated successfully:', response);
        // Optionally navigate away or give user feedback
      },
      error => {
        console.error('Error updating guide:', error);
      }
    );
  }
  
  
  
  
  
  
  
}
