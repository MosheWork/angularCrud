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
  departmentTableData: any[] = [];
  ageGenderTableData: any[] = [];


  tableColumns: string[] = [
    'ageGroup', 
    'totalMale', 
    'totalFemale', 
    'walkingMale', 
    'walkingFemale', 
    'achieved70Male', 
    'achieved70Female'
  ];
  generalQuestionsData = [
    { question: "א. מהו כלי הערכה המשמש להערכת ניידות בקבלה ובשחרור מטופלים?", answer: "אומדן נורטון בקבלה , הערכת ניידות בשחרור" },
    { question: "ב. מיהם בעלי התפקידים שביצעו את הולכת המטופלים? (בחירה מתוך רשימה נפתחת)", answer: "מתנדב" },
    { question: "", answer: "בן משפחה" },
    { question: "", answer: "סטודנט" },
    { question: "", answer: "כח עזר" },
    { question: "", answer: "אחות" },
    { question: "", answer: "רופא" },
    { question: "", answer: "פיזיותרפיסט" },
    { question: "", answer: "אחר ... לפרט בהערות" },
    { question: "", answer: "מטופל עצמאי" }
  ];
  
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

        // First Table Data
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

        this.tableData = [transformedData];

        // Second Table Data (Grouped by Department)
        this.departmentTableData = [
          {
            departmentType: "פנימית",
            departmentName: "מחלקת פנימית ב",
            totalPatients: data.filter(row => row.UnitName === 'מחלקת פנימית ב').length,
            walkingParticipants: data.filter(row => row.UnitName === 'מחלקת פנימית ב' && row.TotalPercentage >= 70).length
          },
          {
            departmentType: "כירורגית",
            departmentName: "מחלקת כירורגיה",
            totalPatients: data.filter(row => row.UnitName === 'מחלקת כירורגיה').length,
            walkingParticipants: data.filter(row => row.UnitName === 'מחלקת כירורגיה' && row.TotalPercentage >= 70).length
          }
        ];

        // Function to count patients based on age range and gender
      const countPatients = (minAge: number, maxAge: number, gender: string) =>
      data.filter(row => row.AgeYears >= minAge && row.AgeYears <= maxAge && row.Gender === gender).length;

    // Grouped Data for the Table
    this.ageGenderTableData = [
      {
        ageGroup: "65-74",
        totalMale: countPatients(65, 74, "זכר"),
        totalFemale: countPatients(65, 74, "נקבה"),
        walkingMale: data.filter(row => row.AgeYears >= 65 && row.AgeYears <= 74 && row.Gender === "זכר" && ['מחלקת פנימית ב', 'מחלקת כירורגיה'].includes(row.UnitName)).length,
        walkingFemale: data.filter(row => row.AgeYears >= 65 && row.AgeYears <= 74 && row.Gender === "נקבה" && ['מחלקת פנימית ב', 'מחלקת כירורגיה'].includes(row.UnitName)).length,
        achieved70Male: data.filter(row => row.AgeYears >= 65 && row.AgeYears <= 74 && row.Gender === "זכר" && ['מחלקת פנימית ב', 'מחלקת כירורגיה'].includes(row.UnitName) && row.TotalPercentage >= 70).length,
        achieved70Female: data.filter(row => row.AgeYears >= 65 && row.AgeYears <= 74 && row.Gender === "נקבה" && ['מחלקת פנימית ב', 'מחלקת כירורגיה'].includes(row.UnitName) && row.TotalPercentage >= 70).length
      },
      {
        ageGroup: "75-84",
        totalMale: countPatients(75, 84, "זכר"),
        totalFemale: countPatients(75, 84, "נקבה"),
        walkingMale: data.filter(row => row.AgeYears >= 75 && row.AgeYears <= 84 && row.Gender === "זכר" && ['מחלקת פנימית ב', 'מחלקת כירורגיה'].includes(row.UnitName)).length,
        walkingFemale: data.filter(row => row.AgeYears >= 75 && row.AgeYears <= 84 && row.Gender === "נקבה" && ['מחלקת פנימית ב', 'מחלקת כירורגיה'].includes(row.UnitName)).length,
        achieved70Male: data.filter(row => row.AgeYears >= 75 && row.AgeYears <= 84 && row.Gender === "זכר" && ['מחלקת פנימית ב', 'מחלקת כירורגיה'].includes(row.UnitName) && row.TotalPercentage >= 70).length,
        achieved70Female: data.filter(row => row.AgeYears >= 75 && row.AgeYears <= 84 && row.Gender === "נקבה" && ['מחלקת פנימית ב', 'מחלקת כירורגיה'].includes(row.UnitName) && row.TotalPercentage >= 70).length
      },
      {
        ageGroup: "85 ומעלה",
        totalMale: countPatients(85, 150, "זכר"),
        totalFemale: countPatients(85, 150, "נקבה"),
        walkingMale: data.filter(row => row.AgeYears >= 85 && row.Gender === "זכר" && ['מחלקת פנימית ב', 'מחלקת כירורגיה'].includes(row.UnitName)).length,
        walkingFemale: data.filter(row => row.AgeYears >= 85 && row.Gender === "נקבה" && ['מחלקת פנימית ב', 'מחלקת כירורגיה'].includes(row.UnitName)).length,
        achieved70Male: data.filter(row => row.AgeYears >= 85 && row.Gender === "זכר" && ['מחלקת פנימית ב', 'מחלקת כירורגיה'].includes(row.UnitName) && row.TotalPercentage >= 70).length,
        achieved70Female: data.filter(row => row.AgeYears >= 85 && row.Gender === "נקבה" && ['מחלקת פנימית ב', 'מחלקת כירורגיה'].includes(row.UnitName) && row.TotalPercentage >= 70).length
      }
    ];

    // Add Total Row
    this.ageGenderTableData.push({
      ageGroup: "סה\"כ",
      totalMale: this.ageGenderTableData.reduce((sum, row) => sum + row.totalMale, 0),
      totalFemale: this.ageGenderTableData.reduce((sum, row) => sum + row.totalFemale, 0),
      walkingMale: this.ageGenderTableData.reduce((sum, row) => sum + row.walkingMale, 0),
      walkingFemale: this.ageGenderTableData.reduce((sum, row) => sum + row.walkingFemale, 0),
      achieved70Male: this.ageGenderTableData.reduce((sum, row) => sum + row.achieved70Male, 0),
      achieved70Female: this.ageGenderTableData.reduce((sum, row) => sum + row.achieved70Female, 0)
    });
      },
      (error) => {
        console.error('❌ API Error:', error);
        this.isLoading = false;
      }
    );
  }
}
