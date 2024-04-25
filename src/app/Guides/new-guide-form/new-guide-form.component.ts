import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-new-guide-form',
  templateUrl: './new-guide-form.component.html',
  styleUrls: ['./new-guide-form.component.scss']
})
export class NewGuideFormComponent {
  title: string = '';
  createdBy: string = '';
  sections: any[] = [];

  constructor(private http: HttpClient) { }

  addTextSection() {
    this.sections.push({ type: 'text', content: '' });
  }

  addImageSection() {
    this.sections.push({ type: 'image', content: null });
  }

  handleImageChange(event: any, index: number) {
    const file = event.target.files[0];
    if (file) {
      this.sections[index].content = file;  // Ensure this is being hit
    }
  }

  submitForm() {
    const formData = new FormData();
    formData.append('title', this.title);
    formData.append('createdBy', this.createdBy);
    this.sections.forEach((section, index) => {
      if (section.type === 'text') {
        formData.append(`textContents[${index}]`, section.content);
      } else if (section.type === 'image' && section.content) {
        formData.append(`images`, section.content);  // Note: Simplified the key for debugging
      }
    });
    
  
    this.http.post('https://localhost:7144/api/GuidesAPI/upload', formData, { responseType: 'text' })
      .subscribe(
        response => {
          console.log('Guide uploaded successfully:', response);
        },
        error => {
          console.error('Error uploading guide:', error);
        }
      );
  }
  
  
}
