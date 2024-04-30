import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';

@Component({
  selector: 'app-new-guide-form',
  templateUrl: './new-guide-form.component.html',
  styleUrls: ['./new-guide-form.component.scss'],
})
export class NewGuideFormComponent {
  title: string = '';
  createdBy: string = '';
  sections: any[] = [];

  constructor(private http: HttpClient) {}

  addTextSection() {
    this.sections.push({ type: 'text', content: '', position: this.sections.length + 1 });
  }

  addImageSection() {
    this.sections.push({ type: 'image', content: null, position: this.sections.length + 1 });
  }

  handleImageChange(event: any, index: number) {
    const file = event.target.files[0];
    if (file) {
      this.sections[index].content = file;
  
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.sections[index].preview = e.target.result;
        this.sections = [...this.sections]; // Trigger change detection
      };
      reader.readAsDataURL(file);
    }
  }

  moveSectionUp(index: number) {
    if (index > 0) {
      [this.sections[index], this.sections[index - 1]] = [this.sections[index - 1], this.sections[index]];
      this.updatePositions();
    }
  }

  moveSectionDown(index: number) {
    if (index < this.sections.length - 1) {
      [this.sections[index], this.sections[index + 1]] = [this.sections[index + 1], this.sections[index]];
      this.updatePositions();
    }
  }

  updatePositions() {
    this.sections = this.sections.map((section, idx) => ({ ...section, position: idx + 1 }));
  }

  submitForm() {
    const formData = new FormData();
    formData.append('title', this.title);
    formData.append('createdBy', this.createdBy);
    this.sections.forEach((section, index) => {
      if (section.type === 'text') {
        formData.append('positions[]', String(section.position)); // Append position for each text content
        formData.append('textContents[]', section.content); // Append text content
      } else if (section.type === 'image' && section.content) {
        formData.append('images', section.content);
      }
    });
  
    this.http.post(environment.apiUrl + 'GuidesAPI/upload', formData, {
      responseType: 'text',
    }).subscribe(
      response => {
        console.log('Guide uploaded successfully:', response);
      },
      error => {
        console.error('Error uploading guide:', error);
      }
    );
  }
  
}
