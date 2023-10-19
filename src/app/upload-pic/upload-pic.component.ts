import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-upload-pic',
  templateUrl: './upload-pic.component.html',
  styleUrls: ['./upload-pic.component.scss']
})
export class UploadPicComponent implements OnInit{
  pictureLink: string | undefined;

  constructor(private httpClient: HttpClient) { }
  uploadPath: string = 'http://localhost:7144/api/UploadPic/';
  ngOnInit() { }

  onFileUpload(event: any) {
    const file = event.target.files[0];

    // Create a FormData object to hold the file.
    const formData = new FormData();
    formData.append('file', file);

    // Post the file to the API endpoint.
    this.httpClient.post(this.uploadPath, formData)
      .subscribe((response: any) => {
        // Get the link to the uploaded picture from the API response.
        this.pictureLink = response.filePath;

        // Display the picture in the Angular component.
        // ...
      }, (error) => {
        // Something went wrong while uploading the file.
      });
  }

}
