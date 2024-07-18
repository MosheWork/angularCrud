import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-upload-guide',
  templateUrl: './upload-guide.component.html',
  styleUrls: ['./upload-guide.component.scss']
})
export class UploadGuideComponent {
  guide = {
    Title: '',
    Description: ''
  };
  selectedFile: File | null = null;

  constructor(private http: HttpClient) {}

  onFileChange(event: any) {
    this.selectedFile = event.target.files[0];
  }

  onSubmit() {
    if (!this.selectedFile) {
      console.error('No file selected');
      return;
    }

    const formData = new FormData();
    formData.append('Title', this.guide.Title);
    formData.append('Description', this.guide.Description);
    formData.append('FileUpload', this.selectedFile, this.selectedFile.name);

    this.http.post(environment.apiUrl + 'GuideManager/guides/upload', formData)
      .subscribe(response => {
        console.log(response);
      }, error => {
        console.error('Error uploading guide:', error);
      });
  }
}
