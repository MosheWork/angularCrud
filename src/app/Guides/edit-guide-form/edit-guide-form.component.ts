import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from 'environments/environment';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';


interface ApiResponse {
  message: string;
}

interface Section {
  id?: number;  // Optional identifier for the section
  type: string;
  position: number;
  content: string | File; // Accept both string or File
  preview?: string;
  createdBy: string;
  isChanged: boolean;
  isNew: boolean;
  pictureId?: number;  // Optional identifier for linked picture
  textSectionId?: number;  // Optional identifier for linked text section
}
interface Guide {
  title: string;
  createdBy: string;
  sections: Section[];
}
interface Picture {
  pictureId: number; // Unique identifier for the picture
  imagePath: string;
  position: number;
  createdBy: string;
}

interface TextSection {
  textSectionId: number; // Unique identifier for the text section
  textContent: string;
  position: number;
  createdBy: string;
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
    private router: Router,
    private cdr: ChangeDetectorRef  // Inject ChangeDetectorRef
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
          ...data.pictures.map((picture, index) => ({
            id: picture.pictureId,  // Assuming pictureId is always defined and unique
            type: 'image',
            content: picture.imagePath,
            position: picture.position,
            preview: this.transformImagePath(picture.imagePath),
            createdBy: picture.createdBy,
            isChanged: false,
            isNew: false,
          })),
          ...data.textSections.map((text, index) => ({
            id: text.textSectionId,  // Assuming textSectionId is always defined and unique
            type: 'text',
            content: text.textContent,
            position: text.position,
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

  handleTextChange(event: Event, index: number): void {
    const element = event.target as HTMLInputElement | HTMLTextAreaElement;  // Type assertion

    // Check if the element is correctly identified and has a value property
    if (element && typeof element.value === 'string') {
        const newText = element.value;
        if (newText !== this.guide.sections[index].content) {
            this.guide.sections[index].content = newText;
            this.guide.sections[index].isChanged = true;
            console.log('Text content changed:', newText);
        }
    } else {
        console.error('Invalid element or event:', event);
    }
}

trackBySection(index: number, section: Section): number {
  return section.id ?? index;  // Use index as a fallback if id is undefined
}

  
  
moveSectionUp(index: number): void {
  if (index > 0) {
    this.swapSections(index, index - 1);
  }
}

moveSectionDown(index: number): void {
  if (index < this.guide.sections.length - 1) {
    this.swapSections(index, index + 1);
  }
}

private swapSections(index1: number, index2: number): void {
  // Swap only the positions
  let positionTemp = this.guide.sections[index1].position;
  this.guide.sections[index1].position = this.guide.sections[index2].position;
  this.guide.sections[index2].position = positionTemp;

  // Mark sections as changed
  this.guide.sections[index1].isChanged = true;
  this.guide.sections[index2].isChanged = true;

  // Ensure UI updates
  this.cdr.detectChanges();
}


  updateGuide(): void {
    const updatedGuide = {
        title: this.guide.title,
        createdBy: this.guide.createdBy,
        sections: this.guide.sections.filter(section => section.isChanged || section.isNew).map(section => {
            const { type, content, position, createdBy, isNew } = section;
            return { type, content, position, createdBy, isNew };
        })
    };

    console.log('Sending updated guide data to backend:', updatedGuide); // Ensure this logs correct data
    this.sendUpdateRequest(updatedGuide);
}


  
  
  
  sendUpdateRequest(guideData: any): void {
    const formData = new FormData();
    formData.append('title', guideData.title);
    formData.append('createdBy', guideData.createdBy);
  
    guideData.sections.forEach((section: Section, index: number) => {
      if (section.type === 'image' && section.content instanceof File) {
        formData.append('images', section.content, section.content.name);
        formData.append('imagePositions[]', section.position.toString());
      } else if (section.type === 'text') {
        formData.append('textContents[]', section.content as string);
        formData.append('textPositions[]', section.position.toString());
      }
    });
    
  
    // Send the request
    this.http.put<ApiResponse>(`${environment.apiUrl}GuidesAPI/${this.guideId}`, formData).subscribe({
      next: (response) => console.log('Guide updated successfully:', response.message),
      error: (error) => console.error('Error updating guide:', error)
    });
  }
  

  
}
