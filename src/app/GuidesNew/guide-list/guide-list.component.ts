import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-guide-list',
  templateUrl: './guide-list.component.html',
  styleUrls: ['./guide-list.component.scss']
})
export class GuideListComponent implements OnInit {
  guides: any[] = [];
  displayedColumns: string[] = ['Title', 'Description', 'CreatedDate', 'actions'];
  selectedFilePath: SafeResourceUrl | null = null;
  environment = environment;

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.http.get<any[]>(`${this.environment.apiUrl}GuideManager/guides`)
      .subscribe(data => {
        this.guides = data;
      });
  }

  viewGuide(fileName: string | null) {
    if (!fileName) {
      console.error('File name is null or undefined');
      return;
    }

    const sanitizedFileName = encodeURIComponent(fileName);
    console.log(`Viewing guide: ${sanitizedFileName}`);
    this.selectedFilePath = this.sanitizer.bypassSecurityTrustResourceUrl(`${this.environment.apiUrl}GuideManager/guides/view/${sanitizedFileName}`);
  }
}
