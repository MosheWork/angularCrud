import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-mitav-summary',
  templateUrl: './mitav-summary.component.html',
  styleUrls: ['./mitav-summary.component.scss']
})
export class MitavSummaryComponent implements OnInit {
  isLoading = true;
  tableData: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    this.isLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}/MitavSummary`).subscribe(
      (data) => {
        console.log("✅ API Response Data:", data);
        this.isLoading = false;

        const transformedData = {
          totalPatients: data.length,
          internalAndSurgicalPatients: data.filter(row =>
            ['מחלקת פנימית א', 'מחלקת פנימית ב', 'מחלקת קרדיולוגיה', 'מחלקת כירורגיה',
              'מחלקת אף אוזן גרון', 'מחלקת פה ולסת', 'מחלקת עיניים', 'מחלקת נשים'].includes(row.UnitName)
          ).length,
          walkingProgramPatients: data.filter(row =>
            ['מחלקת פנימית ב', 'מחלקת כירורגיה'].includes(row.UnitName)
          ).length,
          walkingProgramAchieved70: data.filter(row =>
            ['מחלקת פנימית ב', 'מחלקת כירורגיה'].includes(row.UnitName) && row.TotalPercentage >= 70
          ).length
        };

        // Convert object into an array with a single row
        this.tableData = [transformedData];
      },
      (error) => {
        console.error('❌ API Error:', error);
        this.isLoading = false;
      }
    );
  }
}
