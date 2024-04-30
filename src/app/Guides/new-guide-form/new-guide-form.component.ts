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
    // Calculate the next position based on the current number of sections
    let newPosition = this.sections.length + 1;
    this.sections.push({ type: 'text', content: '', position: newPosition });
  }

  addImageSection() {
    let newPosition = this.sections.length + 1;
    this.sections.push({ type: 'image', content: null, position: newPosition });
  }

  handleImageChange(event: any, index: number) {
    const file = event.target.files[0];
    if (file) {
      this.sections[index].content = file;
  
      // Create a file reader
      const reader = new FileReader();
      
      // Set up the onload event handler
      reader.onload = (e: any) => {
        this.sections[index].preview = e.target.result; // Assign the result to preview field
        this.sections = [...this.sections]; // Update the sections array to trigger Angular change detection
      };
  
      // Read the file as a data URL (base64)
      reader.readAsDataURL(file);
    }
  }

  submitForm() {
    const formData = new FormData();
    formData.append('title', this.title);
    formData.append('createdBy', this.createdBy);
    this.sections.forEach((section, index) => {
      formData.append('positions', section.position.toString());
      if (section.type === 'text') {
        formData.append('textContents', section.content);
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
