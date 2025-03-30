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
  selectedYear: number | null = null;
  selectedQuarter: number | null = null;
  
  availableYears = [
    { value: 2023, label: '2023' },
    { value: 2024, label: '2024' },
    { value: 2025, label: '2025' },
  ];
  
  availableQuarters = [
    { value: 1, label: 'רבעון 1' },
    { value: 2, label: 'רבעון 2' },
    { value: 3, label: 'רבעון 3' },
    { value: 4, label: 'רבעון 4' },
  ];
  
  
  originalData: any[] = []; // Full data before filter
  filteredData: any[] = []; // Data after filter
  
  // Summary variables
  totalPatients75Plus = 0;
  screenedForDelirium = 0;
  diagnosedWithDelirium = 0;
  treatedDelirium = 0;
  treatedWithDrug = 0;
  treatedWithoutDrug = 0;
  genderAgeSummary: any[] = [];
  lengthOfStaySummary: any[] = [];
  lengthOfStayDeliriumTable: any[] = [];
  geriatricSummary: any = null;
  dateFrom: Date | null = null;
dateTo: Date | null = null;


  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchData();
    this.fetchData2();
  }
  fetchData(): void {
    this.isLoading = true;
  
    const params: any = {};
    if (this.selectedYear != null) params.year = this.selectedYear;
    if (this.selectedQuarter != null) params.quarter = this.selectedQuarter;
  
    this.http.get<any[]>(`${environment.apiUrl}MitavSummary/Delirium`, { params }).subscribe(
      (data) => {
        console.log("✅ Delirium API Response:", data);
        this.originalData = data;
        this.filteredData = data;
        this.deliriumData = data;
  
        // Only call calculations here
        this.calculateSummary();
        this.calculateLengthOfStaySummary();
        this.calculateSummaryByStay();
  
        this.isLoading = false;
      },
      (error) => {
        console.error('❌ API Error:', error);
        this.isLoading = false;
      }
    );
  }
  
  
  
  

  fetchData2(): void {
    this.isLoading = true;
  
    this.http.get<any[]>(`${environment.apiUrl}MitavSummary/GeriatricConsiliumsRaw`).subscribe(
      (res: any[]) => {
        const filtered = res.filter(entry => {
          const date = new Date(entry.Entry_Date);
          if (!date || isNaN(date.getTime())) return false;
  
          const year = date.getFullYear();
          const quarter = Math.ceil((date.getMonth() + 1) / 3);
  
          const yearPass = !this.selectedYear || year === this.selectedYear;
          const quarterPass = !this.selectedQuarter || quarter === this.selectedQuarter;
  
          return yearPass && quarterPass;
        });
  
        // Unique Patients
        const uniquePatients = new Set(filtered.map(row => row.Patient)).size;
  
        // Unique Patient + Date combination (formatted)
        const uniquePatientDatePairs = new Set(
          filtered.map(row => `${row.Patient}|${new Date(row.Entry_Date).toISOString().split('T')[0]}`)
        ).size;
  
        this.geriatricSummary = {
          UniquePatients: uniquePatients,
          TotalPatientDateRows: uniquePatientDatePairs
        };
  
        this.isLoading = false;
      },
      err => {
        console.error('Error fetching raw geriatric summary:', err);
        this.isLoading = false;
      }
    );
  }
  
  
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  calculateSummary(): void {
    const data = this.deliriumData;
    console.log('📊 Delirium Data sample:', this.deliriumData.slice(0, 5));
    this.totalPatients75Plus = data.length;
    this.screenedForDelirium = data.filter(p => p.Grade !== null).length;
    this.diagnosedWithDelirium = data.filter(p => p.PatientWithDelirium === 'כן').length;
    this.treatedDelirium = data.filter(p => p.DrugForDelirium === 'כן').length;
    this.treatedWithDrug = data.filter(p => p.DrugForDelirium === 'כן').length;
    this.treatedWithoutDrug = this.treatedDelirium - this.treatedWithDrug;
  
    const summary: any = {
      '75-84': { זכר: { total: 0, screened: 0, delirium: 0, treated: 0 }, נקבה: { total: 0, screened: 0, delirium: 0, treated: 0 } },
      '85+': { זכר: { total: 0, screened: 0, delirium: 0, treated: 0 }, נקבה: { total: 0, screened: 0, delirium: 0, treated: 0 } },
    };
  
    data.forEach(p => {
      const ageGroup = p.Age_Years >= 85 ? '85+' : '75-84';
      const gender = (p.Gender_Text || '').trim();
  
      if (!summary[ageGroup]) summary[ageGroup] = {};
      if (!summary[ageGroup][gender]) {
        summary[ageGroup][gender] = { total: 0, screened: 0, delirium: 0, treated: 0 };
      }
  
      summary[ageGroup][gender].total++;
      if (p.Grade !== null) summary[ageGroup][gender].screened++;
      if (p.PatientWithDelirium === 'כן') summary[ageGroup][gender].delirium++;
      if (p.PatientWithDelirium === 'כן' && p.DrugForDelirium === 'כן') {
        summary[ageGroup][gender].treated++;
      }
          });
  
    this.genderAgeSummary = Object.entries(summary).map(([ageGroup, genders]: any) => ({
      ageGroup,
      totalMale: genders['זכר']?.total || 0,
      totalFemale: genders['נקבה']?.total || 0,
      screenedMale: genders['זכר']?.screened || 0,
      screenedFemale: genders['נקבה']?.screened || 0,
      deliriumMale: genders['זכר']?.delirium || 0,
      deliriumFemale: genders['נקבה']?.delirium || 0,
      treatedMale: genders['זכר']?.treated || 0,
      treatedFemale: genders['נקבה']?.treated || 0,
    }));
  
    // Calculate totals for סה"כ (total row)
    const totals = {
      ageGroup: 'סה"כ',
      totalMale: 0,
      totalFemale: 0,
      screenedMale: 0,
      screenedFemale: 0,
      deliriumMale: 0,
      deliriumFemale: 0,
      treatedMale: 0,
      treatedFemale: 0,
    };
  
    this.genderAgeSummary.forEach(row => {
      totals.totalMale += row.totalMale;
      totals.totalFemale += row.totalFemale;
      totals.screenedMale += row.screenedMale;
      totals.screenedFemale += row.screenedFemale;
      totals.deliriumMale += row.deliriumMale;
      totals.deliriumFemale += row.deliriumFemale;
      totals.treatedMale += row.treatedMale;
      totals.treatedFemale += row.treatedFemale;
    });
  
    this.genderAgeSummary.push(totals);
  }
  
  
  calculateLengthOfStaySummary(): void {
    const summary: any = {
      '75-84': {
        total: { days3: 0, days4to5: 0, days6plus: 0 },
        screened: { days3: 0, days4to5: 0, days6plus: 0 },
      },
      '85+': {
        total: { days3: 0, days4to5: 0, days6plus: 0 },
        screened: { days3: 0, days4to5: 0, days6plus: 0 },
      }
    };
  
    this.deliriumData.forEach((p: any) => {
      const ageGroup = p.Age_Years >= 85 ? '85+' : '75-84';
      const days = p.TotalHospDays;
  
      let category = '';
      if (days <= 3) category = 'days3';
      else if (days >= 4 && days <= 5) category = 'days4to5';
      else category = 'days6plus';
  
      summary[ageGroup].total[category]++;
      if (p.Grade !== null) {
        summary[ageGroup].screened[category]++;
      }
    });
  
    this.lengthOfStaySummary = [
      {
        ageGroup: '75-84',
        totalDays3: summary['75-84'].total.days3,
        totalDays4to5: summary['75-84'].total.days4to5,
        totalDays6plus: summary['75-84'].total.days6plus,
        screenedDays3: summary['75-84'].screened.days3,
        screenedDays4to5: summary['75-84'].screened.days4to5,
        screenedDays6plus: summary['75-84'].screened.days6plus,
      },
      {
        ageGroup: '85 ומעלה',
        totalDays3: summary['85+'].total.days3,
        totalDays4to5: summary['85+'].total.days4to5,
        totalDays6plus: summary['85+'].total.days6plus,
        screenedDays3: summary['85+'].screened.days3,
        screenedDays4to5: summary['85+'].screened.days4to5,
        screenedDays6plus: summary['85+'].screened.days6plus,
      },
      {
        ageGroup: 'סה"כ',
        totalDays3: summary['75-84'].total.days3 + summary['85+'].total.days3,
        totalDays4to5: summary['75-84'].total.days4to5 + summary['85+'].total.days4to5,
        totalDays6plus: summary['75-84'].total.days6plus + summary['85+'].total.days6plus,
        screenedDays3: summary['75-84'].screened.days3 + summary['85+'].screened.days3,
        screenedDays4to5: summary['75-84'].screened.days4to5 + summary['85+'].screened.days4to5,
        screenedDays6plus: summary['75-84'].screened.days6plus + summary['85+'].screened.days6plus,
      }
    ];
  }
  
  // ---- TypeScript (in mitav-summary-delirium.component.ts)

calculateSummaryByStay(): void {
  const summary: any = {
    '75-84': {
      delirium: { days3: 0, days4to5: 0, days6plus: 0 },
      treated: { days3: 0, days4to5: 0, days6plus: 0 }
    },
    '85+': {
      delirium: { days3: 0, days4to5: 0, days6plus: 0 },
      treated: { days3: 0, days4to5: 0, days6plus: 0 }
    }
  };

  this.deliriumData.forEach(p => {
    const ageGroup = p.Age_Years >= 85 ? '85+' : '75-84';
    const days = p.TotalHospDays;
    let category = '';
    if (days <= 3) category = 'days3';
    else if (days >= 4 && days <= 5) category = 'days4to5';
    else if (days >= 6) category = 'days6plus';

    if (!category) return;

    if (p.PatientWithDelirium === 'כן') {
      summary[ageGroup].delirium[category]++;
    }
    if (p.PatientWithDelirium === 'כן' && p.DrugForDelirium === 'כן') {
      summary[ageGroup].treated[category]++;
    }
  });

  this.lengthOfStayDeliriumTable = [
    {
      ageGroup: '75-84',
      deliriumDays3: summary['75-84'].delirium.days3,
      deliriumDays4to5: summary['75-84'].delirium.days4to5,
      deliriumDays6plus: summary['75-84'].delirium.days6plus,
      treatedDays3: summary['75-84'].treated.days3,
      treatedDays4to5: summary['75-84'].treated.days4to5,
      treatedDays6plus: summary['75-84'].treated.days6plus,
    },
    {
      ageGroup: '85+',
      deliriumDays3: summary['85+'].delirium.days3,
      deliriumDays4to5: summary['85+'].delirium.days4to5,
      deliriumDays6plus: summary['85+'].delirium.days6plus,
      treatedDays3: summary['85+'].treated.days3,
      treatedDays4to5: summary['85+'].treated.days4to5,
      treatedDays6plus: summary['85+'].treated.days6plus,
    },
    {
      ageGroup: 'סה\"כ',
      deliriumDays3: summary['75-84'].delirium.days3 + summary['85+'].delirium.days3,
      deliriumDays4to5: summary['75-84'].delirium.days4to5 + summary['85+'].delirium.days4to5,
      deliriumDays6plus: summary['75-84'].delirium.days6plus + summary['85+'].delirium.days6plus,
      treatedDays3: summary['75-84'].treated.days3 + summary['85+'].treated.days3,
      treatedDays4to5: summary['75-84'].treated.days4to5 + summary['85+'].treated.days4to5,
      treatedDays6plus: summary['75-84'].treated.days6plus + summary['85+'].treated.days6plus,
    }
  ];
}
applyFilter(): void {
  if (!this.originalData) return;

  const data = this.originalData;

  this.filteredData = data.filter((row: any) => {
    if (!row.ATD_Admission_Date) return false;

    const date = new Date(row.ATD_Admission_Date);
    if (isNaN(date.getTime())) return false;

    const year = date.getFullYear();
    const quarter = Math.ceil((date.getMonth() + 1) / 3);

    const yearPass = !this.selectedYear || year === this.selectedYear;
    const quarterPass = !this.selectedQuarter || quarter === this.selectedQuarter;

    return yearPass && quarterPass;
  });

  console.log("📦 Filtered data from API:", this.filteredData);

  this.deliriumData = this.filteredData;
  this.calculateSummary();
  this.calculateLengthOfStaySummary();
  this.calculateSummaryByStay();

  // only fetch Geriatric data
  this.fetchData2(); 
}




onDateRangeChange(): void {
  this.applyFilter();
  this.fetchData2(); // refetch Geriatric summary when filter changes
}


}
