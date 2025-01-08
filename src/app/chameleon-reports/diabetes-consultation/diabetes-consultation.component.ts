import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-diabetes-consultation',
  templateUrl: './diabetes-consultation.component.html',
  styleUrls: ['./diabetes-consultation.component.scss']
})
export class DiabetesConsultationComponent implements OnInit {
  // Properties for the data
  totalHos: number = 0;
  totalHosWithIcd9: number = 0;
  Icd9Percentage: number = 0;
  totalHosLabResultOver180: number = 0;
  labResultOver180Percentage: number = 0;
  TotalHosInsulin: number = 0;
  insulinPercentage: number = 0;
  Title1: string = ' סה"כ מטופלים- ';
  Title2: string = 'מאושפים:';
  titleUnit: string = 'דוח סכרת ';
  totalResults: number = 0;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchData();
  }

  // Fetch data from the API
  fetchData(): void {
    this.http.get<any>(`${environment.apiUrl}/DiabetesConsultation`).subscribe(
      (data) => {
        this.totalResults = data.TotalHos;
        this.totalHosWithIcd9 = data.TotalHosWithIcd9;
        this.Icd9Percentage = data.Icd9Percentage;
        this.totalHosLabResultOver180 = data.TotalHosLabResultOver180;
        this.labResultOver180Percentage = data.LabResultover180Percentage;
        this.TotalHosInsulin = data.TotalHosInsulin;
        this.insulinPercentage = data.InsulinPercentage;
      },
      (error) => {
        console.error('Error fetching data:', error);
      }
    );
  }
}
