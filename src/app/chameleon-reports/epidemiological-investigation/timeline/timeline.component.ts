import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss']
})
export class TimelineComponent implements OnInit {
  idNum: string = '';
  timelineData: any[] = [];

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    this.idNum = this.route.snapshot.paramMap.get('idNum') || '';
    this.fetchTimelineData();
  }

  fetchTimelineData() {
    this.http.get<any[]>(`${environment.apiUrl}EpidemiologicalInvestigation/timeline`, {
      params: { idNum: this.idNum }
    }).subscribe((data) => {
      this.timelineData = data;
    }, error => {
      console.error('Error fetching timeline data:', error);
    });
  }
}
