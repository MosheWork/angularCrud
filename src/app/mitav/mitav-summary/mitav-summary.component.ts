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
  hospitalizationTableData: any[] = [];
  mobilityAdmissionTableData: any[] = []; 


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

            // **📌 Filtering data where TotalPercentage >= 70**
      const filteredData = data.filter(row => row.TotalPercentage >= 70);
  
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
//5. מספר מאושפזים לפי קבוצת גיל ומשך האשפוז									
// ✅ **Function to filter by Internal & Surgical Departments**
const getInternalAndSurgicalData = (minAge: number, maxAge: number, daysMin: number, daysMax: number) =>
data.filter(row =>
  row.AgeYears >= minAge && row.AgeYears <= maxAge &&
  internalAndSurgicalDepartments.includes(row.UnitName) &&
  row.TotalDaysInHospital >= daysMin && row.TotalDaysInHospital <= daysMax
).length;

// ✅ **Function to filter by Walking Program Departments**
const getWalkingProgramData = (minAge: number, maxAge: number, daysMin: number, daysMax: number) =>
data.filter(row =>
  row.AgeYears >= minAge && row.AgeYears <= maxAge &&
  walkingProgramDepartments.includes(row.UnitName) &&
  row.TotalDaysInHospital >= daysMin && row.TotalDaysInHospital <= daysMax
).length;

// ✅ **Function to filter Walking Program Participants Who Achieved 70%**
const getWalkingProgramAchievedData = (minAge: number, maxAge: number, daysMin: number, daysMax: number) =>
filteredData.filter(row =>
  row.AgeYears >= minAge && row.AgeYears <= maxAge &&
  walkingProgramDepartments.includes(row.UnitName) &&
  row.TotalDaysInHospital >= daysMin && row.TotalDaysInHospital <= daysMax
).length;

// ✅ **Creating the Table Data**
this.hospitalizationTableData = [
{
  ageGroup: "65-74",
  internal3Days: getInternalAndSurgicalData(65, 74, 0, 3),
  internal4to5Days: getInternalAndSurgicalData(65, 74, 4, 5),
  internal6PlusDays: getInternalAndSurgicalData(65, 74, 6, 999),
  walking3Days: getWalkingProgramData(65, 74, 0, 3),
  walking4to5Days: getWalkingProgramData(65, 74, 4, 5),
  walking6PlusDays: getWalkingProgramData(65, 74, 6, 999),
  achieved3Days: getWalkingProgramAchievedData(65, 74, 0, 3),
  achieved4to5Days: getWalkingProgramAchievedData(65, 74, 4, 5),
  achieved6PlusDays: getWalkingProgramAchievedData(65, 74, 6, 999)
},
{
  ageGroup: "75-84",
  internal3Days: getInternalAndSurgicalData(75, 84, 0, 3),
  internal4to5Days: getInternalAndSurgicalData(75, 84, 4, 5),
  internal6PlusDays: getInternalAndSurgicalData(75, 84, 6, 999),
  walking3Days: getWalkingProgramData(75, 84, 0, 3),
  walking4to5Days: getWalkingProgramData(75, 84, 4, 5),
  walking6PlusDays: getWalkingProgramData(75, 84, 6, 999),
  achieved3Days: getWalkingProgramAchievedData(75, 84, 0, 3),
  achieved4to5Days: getWalkingProgramAchievedData(75, 84, 4, 5),
  achieved6PlusDays: getWalkingProgramAchievedData(75, 84, 6, 999)
},
{
  ageGroup: "85 ומעלה",
  internal3Days: getInternalAndSurgicalData(85, 150, 0, 3),
  internal4to5Days: getInternalAndSurgicalData(85, 150, 4, 5),
  internal6PlusDays: getInternalAndSurgicalData(85, 150, 6, 999),
  walking3Days: getWalkingProgramData(85, 150, 0, 3),
  walking4to5Days: getWalkingProgramData(85, 150, 4, 5),
  walking6PlusDays: getWalkingProgramData(85, 150, 6, 999),
  achieved3Days: getWalkingProgramAchievedData(85, 150, 0, 3),
  achieved4to5Days: getWalkingProgramAchievedData(85, 150, 4, 5),
  achieved6PlusDays: getWalkingProgramAchievedData(85, 150, 6, 999)
}
];

// ✅ **Add Total Row**
this.hospitalizationTableData.push({
ageGroup: "סה\"כ",
internal3Days: this.hospitalizationTableData.reduce((sum, row) => sum + row.internal3Days, 0),
internal4to5Days: this.hospitalizationTableData.reduce((sum, row) => sum + row.internal4to5Days, 0),
internal6PlusDays: this.hospitalizationTableData.reduce((sum, row) => sum + row.internal6PlusDays, 0),
walking3Days: this.hospitalizationTableData.reduce((sum, row) => sum + row.walking3Days, 0),
walking4to5Days: this.hospitalizationTableData.reduce((sum, row) => sum + row.walking4to5Days, 0),
walking6PlusDays: this.hospitalizationTableData.reduce((sum, row) => sum + row.walking6PlusDays, 0),
achieved3Days: this.hospitalizationTableData.reduce((sum, row) => sum + row.achieved3Days, 0),
achieved4to5Days: this.hospitalizationTableData.reduce((sum, row) => sum + row.achieved4to5Days, 0),
achieved6PlusDays: this.hospitalizationTableData.reduce((sum, row) => sum + row.achieved6PlusDays, 0)
});

//6. פרמטר ניידות בקבלה			
// ✅ Function to count patients by MobilityOnAdmissionText
const countByMobilityText = (group: any[], mobilityText: string) =>
  group.filter(row => row.MobilityOnAdmissionText.trim() === mobilityText).length;

// ✅ Define Mobility Categories
const mobilityCategories = [
  { text: "לא נייד - 1", label: "1 (אינו נייד כלל)" },
  { text: "מאוד מוגבל - 2", label: "2" },
  { text: "מעט לקויה - 3", label: "3" },
  { text: "מלאה - 4", label: "4 (עצמאי)" }
];

// ✅ New Table: Mobility Parameter at Admission
this.mobilityAdmissionTableData = mobilityCategories.map(category => ({
  parameter: category.label,
  internalAndSurgical: countByMobilityText(
    data.filter(row => internalAndSurgicalDepartments.includes(row.UnitName)),
    category.text
  ),
  walkingProgram: countByMobilityText(
    data.filter(row => walkingProgramDepartments.includes(row.UnitName)),
    category.text
  ),
  walkingProgramAchieved70: countByMobilityText(
    filteredData.filter(row => walkingProgramDepartments.includes(row.UnitName)),
    category.text
  )
}));

// ✅ Add "Unknown" Category
this.mobilityAdmissionTableData.push({
  parameter: "לא ידוע",
  internalAndSurgical: data.filter(row =>
    internalAndSurgicalDepartments.includes(row.UnitName) &&
    !mobilityCategories.some(cat => row.MobilityOnAdmissionText.trim() === cat.text)
  ).length,
  walkingProgram: data.filter(row =>
    walkingProgramDepartments.includes(row.UnitName) &&
    !mobilityCategories.some(cat => row.MobilityOnAdmissionText.trim() === cat.text)
  ).length,
  walkingProgramAchieved70: filteredData.filter(row =>
    walkingProgramDepartments.includes(row.UnitName) &&
    !mobilityCategories.some(cat => row.MobilityOnAdmissionText.trim() === cat.text)
  ).length
});

// ✅ Add "Total" Row
this.mobilityAdmissionTableData.push({
  parameter: "סה\"כ",
  internalAndSurgical: this.mobilityAdmissionTableData.reduce((sum, row) => sum + row.internalAndSurgical, 0),
  walkingProgram: this.mobilityAdmissionTableData.reduce((sum, row) => sum + row.walkingProgram, 0),
  walkingProgramAchieved70: this.mobilityAdmissionTableData.reduce((sum, row) => sum + row.walkingProgramAchieved70, 0)
});

      },
      (error) => {
        console.error('❌ API Error:', error);
        this.isLoading = false;
      }
    );
  }
  
}
