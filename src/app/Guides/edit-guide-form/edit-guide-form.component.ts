import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from 'environments/environment';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

interface ApiResponse {
  message: string;
}

interface Section {
  type: string;
  position: number;
  content: string | File; // Adjust this to accept both string or File
  preview?: string;
  createdBy: string;
  isChanged: boolean; // Ensure this property is included
  isNew: boolean; // Ensure this property is included
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
  styleUrls: ['./edit-guide-form.component.scss'],
})
export class EditGuideFormComponent implements OnInit {
  guideId!: number;
  guide: Guide = {
    title: '',
    createdBy: '',
    sections: [],
  };

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.guideId = +params['id'];
      this.fetchGuide(this.guideId);
    });
  }

  // When loading existing sections from the server
  fetchGuide(id: number): void {
    this.http.get<GuideData>(`${environment.apiUrl}GuidesAPI/${id}`).subscribe({
      next: (data) => {
        this.guide.title = data.title;
        this.guide.createdBy = data.createdBy;
        this.guide.sections = [
          ...data.pictures.map((picture) => ({
            type: 'image',
            content: picture.imagePath,
            position: picture.position,
            preview: this.transformImagePath(picture.imagePath),
            createdBy: picture.createdBy,
            isChanged: false,
            isNew: false,
          })),
          ...data.textSections.map((text, index) => ({
            // Add index to map function
            type: 'text',
            content: text.textContent,
            position: text.position, // Preserve existing position
            createdBy: text.createdBy,
            isChanged: false,
            isNew: false,
          })),
        ].sort((a, b) => a.position - b.position);
      },
      error: (error) => console.error('Error fetching guide:', error),
    });
  }

  transformImagePath(imagePath: string): string {
    const parts = imagePath.split('\\');
    const fileName = parts.pop();
    return fileName
      ? `${environment.imageBaseUrl}${parts.join('/')}/${encodeURIComponent(
          fileName
        )}`
      : '';
  }

  // When adding a new text section
  addTextSection(): void {
    // Filter sections to get only text sections
    const textSections = this.guide.sections.filter(
      (section) => section.type === 'text'
    );

    const maxPosition = Math.max(
      ...this.guide.sections.map((section) => section.position),
      0
    );
    const newPosition = maxPosition + 1;

    // Add the new text section with the calculated position
    this.guide.sections.push({
      type: 'text',
      content: '',
      position: newPosition,
      createdBy: '',
      isChanged: false,
      isNew: true, // Set isNew to true for new text sections
    });

    // Optionally, you can sort the sections array based on position
    // to ensure they are in the correct order
    this.guide.sections.sort((a, b) => a.position - b.position);
  }

  addImageSection(): void {
    const maxPosition = Math.max(
      ...this.guide.sections.map((section) => section.position),
      0
    );
    const newPosition = maxPosition + 1;
    this.guide.sections.push({
      type: 'image',
      content: '',
      position: newPosition,
      createdBy: '',
      isChanged: false,
      isNew: true,
    });
  }

  removeSection(index: number): void {
    this.guide.sections.splice(index, 1);
  }

  handleImageChange(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      this.guide.sections[index].preview = URL.createObjectURL(file);
      this.guide.sections[index].content = file;
      this.guide.sections[index].isChanged = true;
    }
  }

  handleTextChange(event: any, index: number): void {
    const text = event.target.value;
    if (text !== this.guide.sections[index].content) {
      this.guide.sections[index].content = text;
      this.guide.sections[index].isChanged = true;
    }
  }
  moveSectionUp(index: number): void {
    if (index > 0) {
      [this.guide.sections[index - 1], this.guide.sections[index]] = [
        this.guide.sections[index],
        this.guide.sections[index - 1],
      ];
    }
  }

  moveSectionDown(index: number): void {
    if (index < this.guide.sections.length - 1) {
      [this.guide.sections[index + 1], this.guide.sections[index]] = [
        this.guide.sections[index],
        this.guide.sections[index + 1],
      ];
    }
  }

  updateGuide(): void {
    const updatedGuide = {
      title: this.guide.title,
      createdBy: this.guide.createdBy,
      sections: this.guide.sections
        .filter((section) => section.isChanged || section.isNew)
        .map((section) => {
          const { type, content, position, createdBy, isNew } = section;
          return { type, content, position, createdBy, isNew };
        }),
    };

    this.sendUpdateRequest(updatedGuide);
  }

  sendUpdateRequest(guideData: any): void {
    const formData = new FormData();
    formData.append('title', guideData.title);
    formData.append('createdBy', guideData.createdBy);

    guideData.sections.forEach((section: any, index: number) => {
      if (section.type === 'image' && section.content instanceof File) {
        // Ensure the field name matches the backend expectations
        formData.append('images', section.content, section.content.name);
        formData.append('imagePositions[]', section.position.toString());
      } else if (section.type === 'text') {
        // Ensure the field name matches the backend expectations
        formData.append('textContents[]', section.content);
        formData.append('textPositions[]', section.position.toString());
      }
    });

  // Modify your HTTP request to expect a response of type ApiResponse
this.http.put<ApiResponse>(`${environment.apiUrl}GuidesAPI/${this.guideId}`, formData)
.subscribe({
  next: (response) => {
    console.log('Guide updated successfully:', response.message);
    // Navigate or perform other actions upon success
    this.router.navigate(['guide/', this.guideId]);
  },
  error: (error) => {
    console.error('Error updating guide:', error);
    // Handle errors appropriately
  }
});
  }
}
