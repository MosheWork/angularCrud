import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-guide-manager',
  templateUrl: './guide-manager.component.html',
  styleUrls: ['./guide-manager.component.scss']
})
export class GuideManagerComponent implements OnInit {
  uploadForm: FormGroup;
  selectedFiles: { [key: string]: File | null } = {
    Guide1: null,
    Guide2: null,
    Guide3: null
  };
  dataSource = new MatTableDataSource<any>();
  displayedColumns: string[] = ['AppName', 'AppManngerMain', 'AppManngerSecondry', 'Comments', 'Guide1', 'LastUpdate', 'Download'];
  loginUserName = 'admin';

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.uploadForm = this.fb.group({
      AppName: [''],
      AppManngerMain: [''],
      AppManngerSecondry: [''],
      Comments: ['']
    });
  }

  ngOnInit(): void {
    this.fetchUploadedGuides();
  }

  onFileSelected(event: any, guideKey: string): void {
    this.selectedFiles[guideKey] = event.target.files[0];
  }

  uploadFile(): void {
    if (!this.uploadForm.valid) return;

    const formData = new FormData();
    formData.append('AppName', this.uploadForm.value.AppName);
    formData.append('AppManngerMain', this.uploadForm.value.AppManngerMain);
    formData.append('AppManngerSecondry', this.uploadForm.value.AppManngerSecondry);
    formData.append('Comments', this.uploadForm.value.Comments);
    formData.append('UploadedBy', this.loginUserName); // backend expects "UploadedBy"

    // if (this.selectedFiles.Guide1) {
    //   formData.append('Guide1', this.selectedFiles.Guide1);
    // }
    // if (this.selectedFiles.Guide2) {
    //   formData.append('Guide2', this.selectedFiles.Guide2);
    // }
    // if (this.selectedFiles.Guide3) {
    //   formData.append('Guide3', this.selectedFiles.Guide3);
    // }

    this.http.post(environment.apiUrl + 'GuideUpload/Upload', formData).subscribe({
      next: () => {
        this.uploadForm.reset();
        this.selectedFiles = { Guide1: null, Guide2: null, Guide3: null };
        this.fetchUploadedGuides();
      },
      error: err => console.error('Upload failed:', err)
    });
  }

  fetchUploadedGuides(): void {
    this.http.get<any[]>(environment.apiUrl + 'GuideUpload/GetAll').subscribe(data => {
      this.dataSource.data = data;
    });
  }
}

