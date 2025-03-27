import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-mitav-summary-delirium',
  templateUrl: './mitav-summary-delirium.component.html',
  styleUrls: ['./mitav-summary-delirium.component.scss']
})
export class MitavSummaryDeliriumComponent implements OnInit {
  isLoading = true;
  deliriumData: any[] = [];

  // Summary variables
  totalPatients75Plus = 0;
  screenedForDelirium = 0;
  diagnosedWithDelirium = 0;
  treatedDelirium = 0;
  treatedWithDrug = 0;
  treatedWithoutDrug = 0;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    this.isLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}MitavSummary/Delirium`).subscribe(
      (data) => {
        console.log("✅ Delirium API Response:", data);
        this.deliriumData = data;
        this.calculateSummary();
        this.isLoading = false;
      },
      (error) => {
        console.error('❌ API Error:', error);
        this.isLoading = false;
      }
    );
  }

  calculateSummary(): void {
    // Make sure the casing matches the API field names exactly!
    const filtered = this.deliriumData.filter(p => p.Age_Years >= 75);
  
    this.totalPatients75Plus = filtered.length;
    this.screenedForDelirium = filtered.filter(p => p.Grade !== null && p.Grade !== undefined).length;
    this.diagnosedWithDelirium = filtered.filter(p => p.PatientWithDelirium === 'כן').length;
    this.treatedDelirium = filtered.filter(p => p.PreventionORInterventionCAM !== 'לא בוצע').length;
    this.treatedWithDrug = filtered.filter(p => p.DrugForDelirium === 'כן').length;
    this.treatedWithoutDrug = this.treatedDelirium - this.treatedWithDrug;
  
  
  }
  
}
