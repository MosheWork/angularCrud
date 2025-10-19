import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import * as XLSX from 'xlsx';

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

geriatricAll: any[] = []; // cache: all rows from GeriatricConsiliumsRaw (loaded once)

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchData();           // loads delirium tables
    this.fetchGeriatricOnce();  // loads geriatric data once
  }

  
  fetchGeriatricOnce(): void {
    this.http.get<any[]>(`${environment.apiUrl}MitavSummary/GeriatricConsiliumsRaw`)
      .subscribe(
        (res) => {
          this.geriatricAll = Array.isArray(res) ? res : [];
          this.recomputeGeriatric(); // compute with current filters (possibly none)
        },
        (err) => {
          console.error('❌ Geriatric fetch error:', err);
          this.geriatricAll = [];
          this.geriatricSummary = { uniqueAdmissions: 0, totalConsiliums: 0 };
        }
      );
  }
private isYes = (v: any) =>
  typeof v === 'string' && v.replace(/[\u200e\u200f\s]/g, '') === 'כן';

private passesYearQuarter = (d: any): boolean => {
  const t = d ? new Date(d) : null;
  if (!t || isNaN(t.getTime())) {
    // keep rows with missing date only when no filter is selected
    return this.selectedYear == null && this.selectedQuarter == null;
  }
  const y = t.getFullYear();
  const q = Math.ceil((t.getMonth() + 1) / 3);
  const yearPass = this.selectedYear == null || y === this.selectedYear;
  const quarterPass = this.selectedQuarter == null || q === this.selectedQuarter;
  return yearPass && quarterPass;
};

recomputeGeriatric(): void {
  const passYQ = (d: any): boolean => {
    const t = d ? new Date(d) : null;
    if (!t || isNaN(t.getTime())) {
      // keep rows with missing date only when no filter is selected
      return this.selectedYear == null && this.selectedQuarter == null;
    }
    const y = t.getFullYear();
    const q = Math.ceil((t.getMonth() + 1) / 3);
    const yearPass = this.selectedYear == null || y === this.selectedYear;
    const quarterPass = this.selectedQuarter == null || q === this.selectedQuarter;
    return yearPass && quarterPass;
  };

  const rows = (this.geriatricAll || []).filter(r => passYQ(r.ATD_Admission_Date));
  const totalConsiliums = rows.length; // count ALL rows after Y/Q filter
  const matchedCount = rows.filter(r => this.isYes(r?.MatchInMitav ?? r?.matchInMitav ?? r?.matchInMITAV)).length;

  this.geriatricSummary = {
    uniqueAdmissions: matchedCount,   // your first <td>
    totalConsiliums: totalConsiliums  // your second <td>
  };

  // Debug (remove if you want)
  console.log('[Geriatric] after filter: rows=', rows.length,
              ' matched(כן)=', matchedCount,
              ' y=', this.selectedYear, ' q=', this.selectedQuarter);
}

private stripRtl(s: string | null): string {
  return s ? s.replace(/[\u200e\u200f\u200d]/g, '') : '';
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
  
    // normalize "כן" with possible RTL marks/spaces
    const isYes = (v: any) =>
      typeof v === 'string' && v.replace(/[\u200e\u200f\s]/g, '') === 'כן';
  
    // year/quarter predicate on ATD_Admission_Date
    const passYQ = (d: any): boolean => {
      const t = d ? new Date(d) : null;
      if (!t || isNaN(t.getTime())) {
        // if no date and no filter selected — keep; if filter selected — drop
        return this.selectedYear == null && this.selectedQuarter == null;
      }
      const y = t.getFullYear();
      const q = Math.ceil((t.getMonth() + 1) / 3);
      const yearPass = this.selectedYear == null || y === this.selectedYear;
      const quarterPass = this.selectedQuarter == null || q === this.selectedQuarter;
      return yearPass && quarterPass;
    };
  
    this.http.get<any[]>(`${environment.apiUrl}MitavSummary/GeriatricConsiliumsRaw`).subscribe(
      (res: any[]) => {
        // 1) filter by ATD_Admission_Date
        const rows = (res || []).filter(r => passYQ(r.ATD_Admission_Date));
  
        // 2) total rows after filter
        const totalConsiliums = rows.length;
  
        // 3) rows where MatchInMitav === 'כן'
        const matchedCount = rows.filter(r =>
          isYes(r?.MatchInMitav ?? r?.matchInMitav ?? r?.matchInMITAV ?? '')
        ).length;
  
        // 4) bind exactly to your template field names
        this.geriatricSummary = {
          uniqueAdmissions: matchedCount,     // "סה\"כ מאושפזים 75+ שקיבלו ייעוץ גריאטרי"
          totalConsiliums: totalConsiliums    // "סה\"כ ייעוצים גריאטריים"
        };
  
        this.isLoading = false;
      },
      err => {
        console.error('Error fetching raw geriatric summary:', err);
        this.geriatricSummary = { uniqueAdmissions: 0, totalConsiliums: 0 };
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
    this.screenedForDelirium = data.filter(p => p.grade !== null).length;
    this.diagnosedWithDelirium = data.filter(p => (p.patientWithDelirium || '').trim() === 'כן').length;
    this.treatedDelirium = data.filter(p =>
      p.patientWithDelirium === 'כן' &&
      p.preventionORInterventionCAM &&
      p.preventionORInterventionCAM.trim() !== 'לא בוצע'
    ).length;
    this.treatedWithDrug = data.filter(p =>
      p.patientWithDelirium === 'כן' &&
      typeof p.preventionORInterventionCAM === 'string' &&
      p.preventionORInterventionCAM.includes('התערבות')
    ).length;   
    this.treatedWithoutDrug = data.filter(p =>
      p.patientWithDelirium === 'כן' &&
      typeof p.preventionORInterventionCAM === 'string' &&
      p.preventionORInterventionCAM.includes('מניעה')
    ).length;  
    const summary: any = {
      '75-84': { זכר: { total: 0, screened: 0, delirium: 0, treated: 0 }, נקבה: { total: 0, screened: 0, delirium: 0, treated: 0 } },
      '85+': { זכר: { total: 0, screened: 0, delirium: 0, treated: 0 }, נקבה: { total: 0, screened: 0, delirium: 0, treated: 0 } },
    };
  
    data.forEach(p => {
      const ageGroup = p.age_Years >= 85 ? '85+' : '75-84';
      const gender = (p.gender_Text || '').trim();
  
      if (!summary[ageGroup]) summary[ageGroup] = {};
      if (!summary[ageGroup][gender]) {
        summary[ageGroup][gender] = { total: 0, screened: 0, delirium: 0, treated: 0 };
      }
  
      summary[ageGroup][gender].total++;
      if (p.grade !== null) summary[ageGroup][gender].screened++;
      if (p.patientWithDelirium === 'כן') summary[ageGroup][gender].delirium++;
      if (p.patientWithDelirium === 'כן' && p.drugForDelirium === 'כן') {
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
      const ageGroup = p.age_Years >= 85 ? '85+' : '75-84';
      const days = p.totalHospDays;
  
      let category = '';
      if (days <= 3) category = 'days3';
      else if (days >= 4 && days <= 5) category = 'days4to5';
      else category = 'days6plus';
  
      summary[ageGroup].total[category]++;
      if (p.grade !== null) {
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
    const ageGroup = p.age_Years >= 85 ? '85+' : '75-84';
    const days = p.totalHospDays;
    let category = '';
    if (days <= 3) category = 'days3';
    else if (days >= 4 && days <= 5) category = 'days4to5';
    else if (days >= 6) category = 'days6plus';

    if (!category) return;

    if (p.patientWithDelirium === 'כן') {
      summary[ageGroup].delirium[category]++;
    }
    if (p.patientWithDelirium === 'כן' && p.drugForDelirium === 'כן') {
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
    if (!row.atD_Admission_Date) return false;

    const date = new Date(row.atD_Admission_Date);
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
  this.recomputeGeriatric();

  // only fetch Geriatric data
 // this.fetchData2(); 
}




onDateRangeChange(): void {
  this.applyFilter();
 // this.fetchData2(); // refetch Geriatric summary when filter changes
}

exportAllTables(): void {
  const wb: XLSX.WorkBook = XLSX.utils.book_new();
  const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([]);
  let rowOffset = 0;

  const addSection = (title: string, headers: string[], data: any[], columns: string[]) => {
    XLSX.utils.sheet_add_aoa(ws, [[title]], { origin: { r: rowOffset, c: 0 } });
    rowOffset += 1;
    XLSX.utils.sheet_add_aoa(ws, [headers], { origin: { r: rowOffset, c: 0 } });
    rowOffset += 1;
    const rows = data.map(row => columns.map(col => row[col]));
    XLSX.utils.sheet_add_aoa(ws, rows, { origin: { r: rowOffset, c: 0 } });
    rowOffset += rows.length + 2;
  };

  addSection("1. סיקור דליריום וטיפול בו", [
    "תיאור", "ערך"
  ], [
    { תיאור: 'סה"כ המאושפזים בגיל 75+', ערך: this.totalPatients75Plus },
    { תיאור: 'סה"כ המאושפזים בגיל 75+ שעברו סיקור לדליריום', ערך: this.screenedForDelirium },
    { תיאור: 'סה"כ המאושפזים בגיל 75+ שאובחנו עם דליריום', ערך: this.diagnosedWithDelirium },
    { תיאור: 'סה"כ שקיבלו טיפול לדליריום (כולל לא-תרופתי)', ערך: this.treatedDelirium },
    { תיאור: 'סה"כ שקיבלו טיפול תרופתי לדליריום', ערך: this.treatedWithDrug },
    { תיאור: 'סה"כ שקיבלו טיפול לא-תרופתי לדליריום', ערך: this.treatedWithoutDrug }
  ], ['תיאור', 'ערך']);

  addSection("2. משתתפים לפי מין וגיל", [
    "קבוצת גיל", "זכר סה\"כ", "נקבה סה\"כ", "זכר נבדקו", "נקבה נבדקו", "זכר דליריום", "נקבה דליריום", "זכר טופלו", "נקבה טופלו"
  ], this.genderAgeSummary, ["ageGroup", "totalMale", "totalFemale", "screenedMale", "screenedFemale", "deliriumMale", "deliriumFemale", "treatedMale", "treatedFemale"]);

  addSection("3. א. לפי גיל ומשך האשפוז - נבדקו", [
    "קבוצת גיל", "סה\"כ עד 3 ימים", "סה\"כ 4-5 ימים", "סה\"כ 6+ ימים", "נבדקו עד 3 ימים", "נבדקו 4-5 ימים", "נבדקו 6+ ימים"
  ], this.lengthOfStaySummary, ["ageGroup", "totalDays3", "totalDays4to5", "totalDays6plus", "screenedDays3", "screenedDays4to5", "screenedDays6plus"]);

  addSection("3. ב. לפי גיל ומשך אשפוז - דליריום וטופלו", [
    "קבוצת גיל", "דליריום עד 3 ימים", "דליריום 4-5 ימים", "דליריום 6+ ימים", "טופלו עד 3 ימים", "טופלו 4-5 ימים", "טופלו 6+ ימים"
  ], this.lengthOfStayDeliriumTable, ["ageGroup", "deliriumDays3", "deliriumDays4to5", "deliriumDays6plus", "treatedDays3", "treatedDays4to5", "treatedDays6plus"]);

  if (this.geriatricSummary) {
    addSection("4. ייעוצים גריאטרים", [
      "סה\"כ מאושפזים 75+", 
      "סה\"כ ייעוצים",
      "ייעוצים ע\"י רופא/ה גריאטר/ית",
      "ייעוצים ע\"י אח/ות קליני/ת"
    ], [{
      "סה\"כ מאושפזים 75+": this.geriatricSummary.uniqueAdmissions,
      "סה\"כ ייעוצים": this.geriatricSummary.totalConsiliums,
      "ייעוצים ע\"י רופא/ה גריאטר/ית": this.geriatricSummary.totalConsiliums,  // Or split if you have more info
      "ייעוצים ע\"י אח/ות קליני/ת": 0
    }], [
      "סה\"כ מאושפזים 75+",
      "סה\"כ ייעוצים",
      "ייעוצים ע\"י רופא/ה גריאטר/ית",
      "ייעוצים ע\"י אח/ות קליני/ת"
    ]);
  }
  

  ws['!dir'] = 'rtl';
  XLSX.utils.book_append_sheet(wb, ws, 'דו"ח דליריום');
  XLSX.writeFile(wb, 'MitavDeliriumSummary.xlsx');
}
}
