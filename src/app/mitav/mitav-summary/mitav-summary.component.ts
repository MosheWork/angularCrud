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
  
        // Global department arrays for reuse
        const internalAndSurgicalDepartments = [
          'מחלקת פנימית א', 'מחלקת פנימית ב', 'מחלקת קרדיולוגיה', 'מחלקת כירורגיה',
          'מחלקת אף אוזן גרון', 'מחלקת פה ולסת', 'מחלקת עיניים', 'מחלקת נשים'
        ];
  
        const walkingProgramDepartments = [
          'מחלקת פנימית ב', 'מחלקת כירורגיה'
        ];
  
        // **📌 First Table Data (General Counts)**
        const transformedData = {
          totalPatients: data.length, // סה"כ מאושפזים בגיל 65+ בכלל המחלקות
          internalAndSurgicalPatients: data.filter(row =>
            internalAndSurgicalDepartments.includes(row.UnitName)
          ).length, // סה"כ מאושפזים בגיל 65+ במחלקות פנימיות וכירורגיות (יעד 2)
          walkingProgramPatients: data.filter(row =>
            walkingProgramDepartments.includes(row.UnitName)
          ).length, // מאושפזים בגיל 65+ בכלל המחלקות המשתתפות בתכנית הליכה
          walkingProgramAchieved70: data.filter(row =>
            walkingProgramDepartments.includes(row.UnitName) && row.TotalPercentage >= 70
          ).length // מאושפזים בגיל 65+ שהשתתפו בתכנית הליכה - מטופלים שעמדו ביעד של 70%
        };
  
        this.tableData = [transformedData];
  
        // **📌 Second Table Data (Grouped by Department)**
        this.departmentTableData = walkingProgramDepartments.map(department => ({
          departmentType: department.includes('פנימית') ? "פנימית" : "כירורגית",
          departmentName: department,
          totalPatients: data.filter(row => row.UnitName === department).length,
          walkingParticipants: data.filter(row =>
            row.UnitName === department && row.TotalPercentage >= 70
          ).length
        }));
  
        // **📌 Function to count patients based on age range, gender, and department**
        const countPatientsByDept = (minAge: number, maxAge: number, gender: string) =>
          data.filter(row =>
            row.AgeYears >= minAge && row.AgeYears <= maxAge &&
            row.Gender.trim() === gender &&
            internalAndSurgicalDepartments.includes(row.UnitName)
          ).length;
  
        // **📌 Third Table (Grouped by Age and Gender)**
        this.ageGenderTableData = [
          {
            ageGroup: "65-74",
            totalMale: countPatientsByDept(65, 74, "זכר"),
            totalFemale: countPatientsByDept(65, 74, "נקבה"),
            walkingMale: data.filter(row =>
              row.AgeYears >= 65 && row.AgeYears <= 74 &&
              row.Gender.trim() === "זכר" &&
              walkingProgramDepartments.includes(row.UnitName)
            ).length,
            walkingFemale: data.filter(row =>
              row.AgeYears >= 65 && row.AgeYears <= 74 &&
              row.Gender.trim() === "נקבה" &&
              walkingProgramDepartments.includes(row.UnitName)
            ).length,
            achieved70Male: data.filter(row =>
              row.AgeYears >= 65 && row.AgeYears <= 74 &&
              row.Gender.trim() === "זכר" &&
              walkingProgramDepartments.includes(row.UnitName) &&
              row.TotalPercentage >= 70
            ).length,
            achieved70Female: data.filter(row =>
              row.AgeYears >= 65 && row.AgeYears <= 74 &&
              row.Gender.trim() === "נקבה" &&
              walkingProgramDepartments.includes(row.UnitName) &&
              row.TotalPercentage >= 70
            ).length
          },
          {
            ageGroup: "75-84",
            totalMale: countPatientsByDept(75, 84, "זכר"),
            totalFemale: countPatientsByDept(75, 84, "נקבה"),
            walkingMale: data.filter(row =>
              row.AgeYears >= 75 && row.AgeYears <= 84 &&
              row.Gender.trim() === "זכר" &&
              walkingProgramDepartments.includes(row.UnitName)
            ).length,
            walkingFemale: data.filter(row =>
              row.AgeYears >= 75 && row.AgeYears <= 84 &&
              row.Gender.trim() === "נקבה" &&
              walkingProgramDepartments.includes(row.UnitName)
            ).length,
            achieved70Male: data.filter(row =>
              row.AgeYears >= 75 && row.AgeYears <= 84 &&
              row.Gender.trim() === "זכר" &&
              walkingProgramDepartments.includes(row.UnitName) &&
              row.TotalPercentage >= 70
            ).length,
            achieved70Female: data.filter(row =>
              row.AgeYears >= 75 && row.AgeYears <= 84 &&
              row.Gender.trim() === "נקבה" &&
              walkingProgramDepartments.includes(row.UnitName) &&
              row.TotalPercentage >= 70
            ).length
          },
          {
            ageGroup: "85 ומעלה",
            totalMale: countPatientsByDept(85, 150, "זכר"),
            totalFemale: countPatientsByDept(85, 150, "נקבה"),
            walkingMale: data.filter(row =>
              row.AgeYears >= 85 &&
              row.Gender.trim() === "זכר" &&
              walkingProgramDepartments.includes(row.UnitName)
            ).length,
            walkingFemale: data.filter(row =>
              row.AgeYears >= 85 &&
              row.Gender.trim() === "נקבה" &&
              walkingProgramDepartments.includes(row.UnitName)
            ).length,
            achieved70Male: data.filter(row =>
              row.AgeYears >= 85 &&
              row.Gender.trim() === "זכר" &&
              walkingProgramDepartments.includes(row.UnitName) &&
              row.TotalPercentage >= 70
            ).length,
            achieved70Female: data.filter(row =>
              row.AgeYears >= 85 &&
              row.Gender.trim() === "נקבה" &&
              walkingProgramDepartments.includes(row.UnitName) &&
              row.TotalPercentage >= 70
            ).length
          }
        ];
  
        // **📌 Add Total Row**
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
