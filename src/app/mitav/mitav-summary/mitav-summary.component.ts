import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import * as XLSX from 'xlsx';

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
  mobilityDischargeTableData: any[] = [];
  mobilityStatusTableData: any[] = [];
  mobilityChangeTableData: any[] = [];
  mobilityBasicFunctionTableData: any[] = [];



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
    this.http.get<any[]>(`${environment.apiUrl}MitavSummary`).subscribe(
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

//7.פרמטר ניידות בשחרור			

const mobilityDischargeCategories = [
  { text: "לא נייד - 1", label: "1 (אינו נייד כלל)" },
  { text: "מאוד מוגבל - 2", label: "2" },
  { text: "מעט לקויה - 3", label: "3" },
  { text: "מלאה - 4", label: "4 (עצמאי)" }
];

// ✅ Build the data with debugging
this.mobilityDischargeTableData = mobilityDischargeCategories.map(category => {
  console.log(`🔍 Processing category: ${category.text}`);

  const internalAndSurgical = data.filter(row => {
    const match = internalAndSurgicalDepartments.includes(row.UnitName) &&
      row.MobilityAssessmentAtDischarge &&
      row.MobilityAssessmentAtDischarge.trim().includes(category.text);
    if (match) {
      console.log(`✅ internalAndSurgical MATCH: Unit=${row.UnitName}, Discharge=${row.MobilityAssessmentAtDischarge}`);
    }
    return match;
  }).length;

  const walkingProgram = data.filter(row => {
    const match = walkingProgramDepartments.includes(row.UnitName) &&
      row.MobilityAssessmentAtDischarge &&
      row.MobilityAssessmentAtDischarge.trim().includes(category.text);
    if (match) {
      console.log(`✅ walkingProgram MATCH: Unit=${row.UnitName}, Discharge=${row.MobilityAssessmentAtDischarge}`);
    }
    return match;
  }).length;

  const walkingProgramAchieved70 = filteredData.filter(row => {
    const match = walkingProgramDepartments.includes(row.UnitName) &&
      row.MobilityAssessmentAtDischarge &&
      row.MobilityAssessmentAtDischarge.trim().includes(category.text);
    if (match) {
      console.log(`✅ walkingProgramAchieved70 MATCH: Unit=${row.UnitName}, Discharge=${row.MobilityAssessmentAtDischarge}`);
    }
    return match;
  }).length;

  console.log(`👉 Totals for "${category.text}": internalAndSurgical=${internalAndSurgical}, walkingProgram=${walkingProgram}, walkingProgramAchieved70=${walkingProgramAchieved70}`);

  return {
    parameter: category.label,
    internalAndSurgical,
    walkingProgram,
    walkingProgramAchieved70
  };
});



// ✅ Add "Unknown" Row with logs
const unknownRow = {
  parameter: "לא ידוע",
  internalAndSurgical: data.filter(row => 
    internalAndSurgicalDepartments.includes(row.UnitName) &&
    (!row.MobilityAssessmentAtDischarge || row.MobilityAssessmentAtDischarge === 'לא בוצעה הערכת ניידות בשחרור')
  ).length,

  walkingProgram: data.filter(row => 
    walkingProgramDepartments.includes(row.UnitName) &&
    (!row.MobilityAssessmentAtDischarge || row.MobilityAssessmentAtDischarge === 'לא בוצעה הערכת ניידות בשחרור')
  ).length,

  walkingProgramAchieved70: filteredData.filter(row => 
    walkingProgramDepartments.includes(row.UnitName) &&
    (!row.MobilityAssessmentAtDischarge || row.MobilityAssessmentAtDischarge === 'לא בוצעה הערכת ניידות בשחרור')
  ).length
};
this.mobilityDischargeTableData.push(unknownRow);

// ✅ Add TOTAL Row with logs

//8. השינוי בפרמטר הניידות בין קבלה לשחרור			
const mobilityChangeCategories = [
  { status: "שיפור", label: "שיפור" },
  { status: "ללא שינוי", label: "ללא שינוי" },
  { status: "הדרדרות", label: "הדרדרות" },
  { status: "לא ידוע", label: "לא ידוע" }
];

this.mobilityChangeTableData = mobilityChangeCategories.map(category => ({
  parameter: category.label,
  internalAndSurgical: data.filter(row =>
    internalAndSurgicalDepartments.includes(row.UnitName) &&
    row.MobilityStatus === category.status
  ).length,
  walkingProgram: data.filter(row =>
    walkingProgramDepartments.includes(row.UnitName) &&
    row.MobilityStatus === category.status
  ).length,
  walkingProgramAchieved70: filteredData.filter(row =>
    walkingProgramDepartments.includes(row.UnitName) &&
    row.MobilityStatus === category.status
  ).length
}));

this.mobilityChangeTableData.push({
  parameter: 'סה"כ',
  internalAndSurgical: this.mobilityChangeTableData.reduce((sum, row) => sum + row.internalAndSurgical, 0),
  walkingProgram: this.mobilityChangeTableData.reduce((sum, row) => sum + row.walkingProgram, 0),
  walkingProgramAchieved70: this.mobilityChangeTableData.reduce((sum, row) => sum + row.walkingProgramAchieved70, 0)
});
// ✅ Add TOTAL Row with logs
const totalRow = {
  parameter: "סה\"כ",
  internalAndSurgical: this.mobilityDischargeTableData.reduce((sum: number, row: any) => sum + row.internalAndSurgical, 0),
  walkingProgram: this.mobilityDischargeTableData.reduce((sum: number, row: any) => sum + row.walkingProgram, 0),
  walkingProgramAchieved70: this.mobilityDischargeTableData.reduce((sum: number, row: any) => sum + row.walkingProgramAchieved70, 0)
};

this.mobilityDischargeTableData.push(totalRow);
console.log('📊 mobilityChangeTableData', this.mobilityChangeTableData);


//9. פרמטר הניידות כפי שדיווח המטופל או משפחתו, טרם המצב הרפואי שהוביל לאשפוז 			
const basicFunctionCategories = [
  { value: "מרותק", label: "1 (אינו נייד כלל)" },
  { value: "נייד ללא עזרת אדם אחר", label: "2" },
  { value: "נייד עם כיסא גלגלים (ללא עזרת אדם)", label: "3" },
  { value: "נייד עם עזרה", label: "4 (עצמאי)" },
  { value: "אין תיעוד", label: "לא ידוע" }
];

this.mobilityBasicFunctionTableData = basicFunctionCategories.map(category => ({
  parameter: category.label,

  // Column 1: Internal & Surgical
  internalAndSurgical: data.filter(row =>
    internalAndSurgicalDepartments.includes(row.UnitName) &&
    row.BasicFunctionBeforeHospitalization?.trim() === category.value
  ).length,

  // Column 2: Walking Program Departments
  walkingProgram: data.filter(row =>
    walkingProgramDepartments.includes(row.UnitName) &&
    row.BasicFunctionBeforeHospitalization?.trim() === category.value
  ).length,

  // Column 3: Walking Program + Achieved >=70%
  walkingProgramAchieved70: filteredData.filter(row =>
    walkingProgramDepartments.includes(row.UnitName) &&
    row.BasicFunctionBeforeHospitalization?.trim() === category.value
  ).length
}));

// ✅ Add TOTAL Row
const totalRowBasicFunction = {
  parameter: "סה\"כ",
  internalAndSurgical: this.mobilityBasicFunctionTableData.reduce((sum: number, row: any) => sum + row.internalAndSurgical, 0),
  walkingProgram: this.mobilityBasicFunctionTableData.reduce((sum: number, row: any) => sum + row.walkingProgram, 0),
  walkingProgramAchieved70: this.mobilityBasicFunctionTableData.reduce((sum: number, row: any) => sum + row.walkingProgramAchieved70, 0)
};
this.mobilityBasicFunctionTableData.push(totalRowBasicFunction);


      },
      

      (error) => {
        console.error('❌ API Error:', error);
        this.isLoading = false;
      }
    );
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
  
    // 1. General Data
    addSection(
      "1. נתונים כלליים",
      ["סה\"כ מאושפזים בגיל 65+ בכלל המחלקות", "בפנימיות וכירורגיות", "במחלקות תכנית הליכה", "תכנית הליכה 70%+"],
      this.tableData,
      ["totalPatients", "internalAndSurgicalPatients", "walkingProgramPatients", "walkingProgramAchieved70"]
    );
  
    // 2. Departments
    addSection(
      "2. התפלגות לפי מחלקה",
      ["סוג מחלקה", "שם מחלקה", "סה\"כ מאושפזים", "הליכה 70%+"],
      this.departmentTableData,
      ["departmentType", "departmentName", "totalPatients", "walkingParticipants"]
    );
  
    // 3. Age & Gender
    addSection(
      "3. גיל ומגדר",
      ["קבוצת גיל", "זכרים סה\"כ", "נקבות סה\"כ", "זכרים הליכה", "נקבות הליכה", "זכרים 70%+", "נקבות 70%+"],
      this.ageGenderTableData,
      ["ageGroup", "totalMale", "totalFemale", "walkingMale", "walkingFemale", "achieved70Male", "achieved70Female"]
    );
  
    // 4. Age vs Hospitalization Days
    addSection(
      "4. גיל מול משך אשפוז",
      ["קבוצת גיל", "פנימיות 0-3 ימים", "פנימיות 4-5 ימים", "פנימיות 6+ ימים", "הליכה 0-3 ימים", "הליכה 4-5 ימים", "הליכה 6+ ימים", "70%+ 0-3 ימים", "70%+ 4-5 ימים", "70%+ 6+ ימים"],
      this.hospitalizationTableData,
      ["ageGroup", "internal3Days", "internal4to5Days", "internal6PlusDays", "walking3Days", "walking4to5Days", "walking6PlusDays", "achieved3Days", "achieved4to5Days", "achieved6PlusDays"]
    );
  
    // 5. Mobility on Admission
    addSection(
      "5. ניידות בקבלה",
      ["פרמטר", "פנימיות וכירורגיות", "תכנית הליכה", "תכנית הליכה 70%+"],
      this.mobilityAdmissionTableData,
      ["parameter", "internalAndSurgical", "walkingProgram", "walkingProgramAchieved70"]
    );
  
    // 6. Mobility at Discharge
    addSection(
      "6. ניידות בשחרור",
      ["פרמטר", "פנימיות וכירורגיות", "תכנית הליכה", "תכנית הליכה 70%+"],
      this.mobilityDischargeTableData,
      ["parameter", "internalAndSurgical", "walkingProgram", "walkingProgramAchieved70"]
    );
  
    // 7. Mobility Change
    addSection(
      "7. שינוי ניידות בין קבלה לשחרור",
      ["פרמטר", "פנימיות וכירורגיות", "תכנית הליכה", "תכנית הליכה 70%+"],
      this.mobilityChangeTableData,
      ["parameter", "internalAndSurgical", "walkingProgram", "walkingProgramAchieved70"]
    );
  
    // 8. Basic Function Before Hospitalization
    addSection(
      "8. תפקוד בסיסי לפני אשפוז",
      ["פרמטר", "פנימיות וכירורגיות", "תכנית הליכה", "תכנית הליכה 70%+"],
      this.mobilityBasicFunctionTableData,
      ["parameter", "internalAndSurgical", "walkingProgram", "walkingProgramAchieved70"]
    );
  
    // 9. General Questions
    addSection(
      "9. שאלות כלליות",
      ["שאלה", "תשובה"],
      this.generalQuestionsData,
      ["question", "answer"]
    );
  
    XLSX.utils.book_append_sheet(wb, ws, 'דו״ח מיטב');
    XLSX.writeFile(wb, 'MitavSummary.xlsx');
  }
  
}
