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
  availableYears: { label: string, value: number | string | null }[] = [];
  availableQuarters: { label: string, value: number | string | null }[] = [];
  selectedYear: number | null = null;
  selectedQuarter: number | null = null;
  // Original data from API
  originalData: any[] = [];
  quartersByYear: { [year: number]: { label: string, value: number }[] } = {};

  // Filtered data based on quarter/year
  filteredData: any[] = [];

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
    const today = new Date();
    this.selectedYear = today.getFullYear();
  }

  fetchData(): void {
    this.isLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}MitavSummary`).subscribe(
      (data) => {
        console.log("✅ API Response Data:", data);
        this.isLoading = false;
        this.originalData = data;
        this.extractYearsAndQuarters(data);
        this.applyFilter();
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
  
    // 1. אוכלוסיות בגיליון
    addSection("1. אוכלוסיות בגיליון", [
      "מאושפזים בגיל 65+ שהתאשפזו בכל מחלקות בית החולים",
      "מאושפזים 65+ בכלל המחלקות באגף הפנימי והכירורגי",
      "מאושפזים בגיל 65+ בכלל המחלקות המשתתפות בתכנית הליכה",
      "מאושפזים בגיל 65+ שהשתתפו בתכנית הליכה - מטופלים שעמדו ביעד של 70%"
    ], this.tableData, ["totalPatients", "internalAndSurgicalPatients", "walkingProgramPatients", "walkingProgramAchieved70"]);
  
    // 2. משתתפים בתכנית הליכה לפי מחלקה (יעד 1)
    addSection("2. משתתפים בתכנית הליכה לפי מחלקה (יעד 1)", [
      "סוג המחלקה (פנימית \\ כירורגית)",
      "שם המחלקה (למשל: כירורגיה כללית א')",
      "מספר מאושפזים בני 65+ במחלקה",
      "מאושפזים בגיל 65+ שהשתתפו בתכנית הליכה"
    ], this.departmentTableData, ["departmentType", "departmentName", "totalPatients", "walkingParticipants"]);
  
    // 3. תכנית הליכה - שאלות כלליות
    addSection("3. תכנית הליכה - שאלות כלליות", ["", ""], this.generalQuestionsData, ["question", "answer"]);
  
    // 4. מספר מאושפזים לפי קבוצת גיל ומין
    addSection("4. מספר מאושפזים לפי קבוצת גיל ומין", [
      "קבוצת גיל", "זכרים סה\"כ", "נקבות סה\"כ", "זכרים הליכה", "נקבות הליכה", "זכרים 70%+", "נקבות 70%+"
    ], this.ageGenderTableData, ["ageGroup", "totalMale", "totalFemale", "walkingMale", "walkingFemale", "achieved70Male", "achieved70Female"]);
  
    // 5. מספר מאושפזים לפי קבוצת גיל ומשך האשפוז
    addSection("5. מספר מאושפזים לפי קבוצת גיל ומשך האשפוז", [
      "קבוצת גיל", "פנימיות 0-3 ימים", "פנימיות 4-5 ימים", "פנימיות 6+ ימים", "הליכה 0-3 ימים", "הליכה 4-5 ימים", "הליכה 6+ ימים", "70%+ 0-3 ימים", "70%+ 4-5 ימים", "70%+ 6+ ימים"
    ], this.hospitalizationTableData, ["ageGroup", "internal3Days", "internal4to5Days", "internal6PlusDays", "walking3Days", "walking4to5Days", "walking6PlusDays", "achieved3Days", "achieved4to5Days", "achieved6PlusDays"]);
  
    // 6. פרמטר ניידות בקבלה
    addSection("6. פרמטר ניידות בקבלה", [
      "פרמטר ניידות / אוכלוסיית מאושפזים", "סה\"כ מאושפזים בגיל 65+ במחלקות פנימיות וכירורגיות (יעד 2)", "מאושפזים בגיל 65+ בכלל המחלקות המשתתפות בתכנית הליכה", "סה\"כ המאושפזים בגיל 65+ שהשתתפו בתכנית הליכה (יעד 1)"
    ], this.mobilityAdmissionTableData, ["parameter", "internalAndSurgical", "walkingProgram", "walkingProgramAchieved70"]);
  
    // 7. פרמטר ניידות בשחרור
    addSection("7. פרמטר ניידות בשחרור", [
      "ציון פרמטר ניידות / אוכלוסיית מאושפזים", "סה\"כ מאושפזים בגיל 65+ במחלקות פנימיות וכירורגיות (יעד 2)", "מאושפזים בגיל 65+ בכלל המחלקות המשתתפות בתכנית הליכה", "סה\"כ המאושפזים בגיל 65 + שהשתתפו בתכנית הליכה (יעד 1)"
    ], this.mobilityDischargeTableData, ["parameter", "internalAndSurgical", "walkingProgram", "walkingProgramAchieved70"]);
  
    // 8. שינוי בפרמטר הניידות בין קבלה לשחרור
    addSection("8. השינוי בפרמטר הניידות בין קבלה לשחרור", [
      "שינוי פרמטר ניידות / אוכלוסיית מאושפזים", "סה\"כ מאושפזים בני 65+ במחלקות פנימיות וכירורגיות (יעד 2)", "מאושפזים בגיל 65+ בכלל המחלקות המשתתפות בתכנית הליכה", "סה\"כ המאושפזים בגיל 65 + שהשתתפו בתכנית הליכה (יעד 1)"
    ], this.mobilityChangeTableData, ["parameter", "internalAndSurgical", "walkingProgram", "walkingProgramAchieved70"]);
  
    // 9. פרמטר הניידות כפי שדיווח המטופל או משפחתו
    addSection("9. פרמטר הניידות כפי שדיווח המטופל או משפחתו", [
      "פרמטר ניידות / אוכלוסיית מאושפזים", "סה\"כ מאושפזים בני 65+ במחלקות פנימיות וכירורגיות (יעד 2)", "מאושפזים בגיל 65+ בכלל המחלקות המשתתפות בתכנית הליכה", "סה\"כ המאושפזים בגיל 65 + שהשתתפו בתכנית הליכה (יעד 1)"
    ], this.mobilityBasicFunctionTableData, ["parameter", "internalAndSurgical", "walkingProgram", "walkingProgramAchieved70"]);
  
    ws['!dir'] = 'rtl';
    XLSX.utils.book_append_sheet(wb, ws, 'דו״ח מיטב');
    XLSX.writeFile(wb, 'MitavSummary.xlsx');
  }

  applyFilter(): void {
    const data = this.originalData;
  
    this.filteredData = data.filter((row: any) => {
      if (!row.admissionDate) return false;
  
      const date = new Date(row.admissionDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const quarter = Math.ceil(month / 3);
  
      const yearPass = (this.selectedYear === -1 || this.selectedYear === null) ? true : year === this.selectedYear;
      const quarterPass = (this.selectedQuarter === -1 || this.selectedQuarter === null) ? true : quarter === this.selectedQuarter;
  
      return yearPass && quarterPass;
    });
  
    this.recalculateTables();
  }
  
  recalculateTables(): void {
    const data = this.filteredData;
  
    const internalAndSurgicalDepartments = [
      'מחלקת אף אוזן גרון',
      'מחלקת כירורגיה',
      'מחלקת נוירולוגיה ושבץ מוחי',
      'מחלקת נשים',
      'מחלקת עיניים',
      'מחלקת פה ולסת',
      'מחלקת פנימית א',
      'מחלקת פנימית ב',
      'מחלקת קרדיולוגיה',
      'כירורגית חזה',
      'כירורגית כלי דם',
      'כירורגית לב',
      'מחלקת אורולוגיה'
    ];
  
    const walkingProgramDepartments = [
      'מחלקת פנימית ב', 'מחלקת כירורגיה'
    ];
  
    const filteredData70 = this.filteredData.filter(row => row.totalPercentage >= 70);
  
    // 1) First table
    const transformedData = {
      totalPatients: data.length,
      internalAndSurgicalPatients: data.filter(row =>
        internalAndSurgicalDepartments.includes(row.unitName)
      ).length,
      walkingProgramPatients: data.filter(row =>
        walkingProgramDepartments.includes(row.unitName)
      ).length,
      walkingProgramAchieved70: data.filter(row =>
        walkingProgramDepartments.includes(row.unitName) && row.totalPercentage >= 70
      ).length
    };
    this.tableData = [transformedData];
  
    // 2) By department
    this.departmentTableData = walkingProgramDepartments.map(department => ({
      departmentType: department.includes('פנימית') ? "פנימית" : "כירורגית",
      departmentName: department,
      totalPatients: data.filter(row => row.unitName === department).length,
      walkingParticipants: data.filter(row =>
        row.unitName === department && row.totalPercentage >= 70
      ).length
    }));
  
    // helper for age/gender
    const countPatientsByDept = (minAge: number, maxAge: number, gender: string) =>
      data.filter(row =>
        row.ageYears >= minAge && row.ageYears <= maxAge &&
        row.gender.trim() === gender &&
        internalAndSurgicalDepartments.includes(row.unitName)
      ).length;
  
    // 3) Age & gender
    this.ageGenderTableData = [
      {
        ageGroup: "65-74",
        totalMale: countPatientsByDept(65, 74, "זכר"),
        totalFemale: countPatientsByDept(65, 74, "נקבה"),
        walkingMale: data.filter(row =>
          row.ageYears >= 65 && row.ageYears <= 74 &&
          row.gender.trim() === "זכר" &&
          walkingProgramDepartments.includes(row.unitName)
        ).length,
        walkingFemale: data.filter(row =>
          row.ageYears >= 65 && row.ageYears <= 74 &&
          row.gender.trim() === "נקבה" &&
          walkingProgramDepartments.includes(row.unitName)
        ).length,
        achieved70Male: data.filter(row =>
          row.ageYears >= 65 && row.ageYears <= 74 &&
          row.gender.trim() === "זכר" &&
          walkingProgramDepartments.includes(row.unitName) &&
          row.totalPercentage >= 70
        ).length,
        achieved70Female: data.filter(row =>
          row.ageYears >= 65 && row.ageYears <= 74 &&
          row.gender.trim() === "נקבה" &&
          walkingProgramDepartments.includes(row.unitName) &&
          row.totalPercentage >= 70
        ).length
      },
      {
        ageGroup: "75-84",
        totalMale: countPatientsByDept(75, 84, "זכר"),
        totalFemale: countPatientsByDept(75, 84, "נקבה"),
        walkingMale: data.filter(row =>
          row.ageYears >= 75 && row.ageYears <= 84 &&
          row.gender.trim() === "זכר" &&
          walkingProgramDepartments.includes(row.unitName)
        ).length,
        walkingFemale: data.filter(row =>
          row.ageYears >= 75 && row.ageYears <= 84 &&
          row.gender.trim() === "נקבה" &&
          walkingProgramDepartments.includes(row.unitName)
        ).length,
        achieved70Male: data.filter(row =>
          row.ageYears >= 75 && row.ageYears <= 84 &&
          row.gender.trim() === "זכר" &&
          walkingProgramDepartments.includes(row.unitName) &&
          row.totalPercentage >= 70
        ).length,
        achieved70Female: data.filter(row =>
          row.ageYears >= 75 && row.ageYears <= 84 &&
          row.gender.trim() === "נקבה" &&
          walkingProgramDepartments.includes(row.unitName) &&
          row.totalPercentage >= 70
        ).length
      },
      {
        ageGroup: "85 ומעלה",
        totalMale: countPatientsByDept(85, 150, "זכר"),
        totalFemale: countPatientsByDept(85, 150, "נקבה"),
        walkingMale: data.filter(row =>
          row.ageYears >= 85 &&
          row.gender.trim() === "זכר" &&
          walkingProgramDepartments.includes(row.unitName)
        ).length,
        walkingFemale: data.filter(row =>
          row.ageYears >= 85 &&
          row.gender.trim() === "נקבה" &&
          walkingProgramDepartments.includes(row.unitName)
        ).length,
        achieved70Male: data.filter(row =>
          row.ageYears >= 85 &&
          row.gender.trim() === "זכר" &&
          walkingProgramDepartments.includes(row.unitName) &&
          row.totalPercentage >= 70
        ).length,
        achieved70Female: data.filter(row =>
          row.ageYears >= 85 &&
          row.gender.trim() === "נקבה" &&
          walkingProgramDepartments.includes(row.unitName) &&
          row.totalPercentage >= 70
        ).length
      }
    ];
  
    this.ageGenderTableData.push({
      ageGroup: "סה\"כ",
      totalMale: this.ageGenderTableData.reduce((sum, row) => sum + row.totalMale, 0),
      totalFemale: this.ageGenderTableData.reduce((sum, row) => sum + row.totalFemale, 0),
      walkingMale: this.ageGenderTableData.reduce((sum, row) => sum + row.walkingMale, 0),
      walkingFemale: this.ageGenderTableData.reduce((sum, row) => sum + row.walkingFemale, 0),
      achieved70Male: this.ageGenderTableData.reduce((sum, row) => sum + row.achieved70Male, 0),
      achieved70Female: this.ageGenderTableData.reduce((sum, row) => sum + row.achieved70Female, 0)
    });

    // 5) Length of stay by age
    const getInternalAndSurgicalData = (minAge: number, maxAge: number, daysMin: number, daysMax: number) =>
      data.filter(row =>
        row.ageYears >= minAge && row.ageYears <= maxAge &&
        internalAndSurgicalDepartments.includes(row.unitName) &&
        row.totalDaysInHospital >= daysMin && row.totalDaysInHospital <= daysMax
      ).length;

    const getWalkingProgramData = (minAge: number, maxAge: number, daysMin: number, daysMax: number) =>
      data.filter(row =>
        row.ageYears >= minAge && row.ageYears <= maxAge &&
        walkingProgramDepartments.includes(row.unitName) &&
        row.totalDaysInHospital >= daysMin && row.totalDaysInHospital <= daysMax
      ).length;

    const getWalkingProgramAchievedData = (minAge: number, maxAge: number, daysMin: number, daysMax: number) =>
      filteredData70.filter(row =>
        row.ageYears >= minAge && row.ageYears <= maxAge &&
        walkingProgramDepartments.includes(row.unitName) &&
        row.totalDaysInHospital >= daysMin && row.totalDaysInHospital <= daysMax
      ).length;

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

    // 6) Mobility on admission
    const countByMobilityText = (rows: any[], mobilityText: string) =>
      rows.filter(row => row.mobilityOnAdmissionText?.trim() === mobilityText).length;

    const mobilityCategories = [
      { text: "לא נייד - 1", label: "1 (אינו נייד כלל)" },
      { text: "מאוד מוגבל - 2", label: "2" },
      { text: "מעט לקויה - 3", label: "3" },
      { text: "מלאה - 4", label: "4 (עצמאי)" }
    ];

    this.mobilityAdmissionTableData = mobilityCategories.map(category => ({
      parameter: category.label,
      internalAndSurgical: countByMobilityText(
        data.filter(row => internalAndSurgicalDepartments.includes(row.unitName)),
        category.text
      ),
      walkingProgram: countByMobilityText(
        data.filter(row => walkingProgramDepartments.includes(row.unitName)),
        category.text
      ),
      walkingProgramAchieved70: countByMobilityText(
        filteredData70.filter(row => walkingProgramDepartments.includes(row.unitName)),
        category.text
      )
    }));

    this.mobilityAdmissionTableData.push({
      parameter: "לא ידוע",
      internalAndSurgical: data.filter(row =>
        internalAndSurgicalDepartments.includes(row.unitName) &&
        !mobilityCategories.some(cat => row.mobilityOnAdmissionText?.trim() === cat.text)
      ).length,
      walkingProgram: data.filter(row =>
        walkingProgramDepartments.includes(row.unitName) &&
        !mobilityCategories.some(cat => row.mobilityOnAdmissionText?.trim() === cat.text)
      ).length,
      walkingProgramAchieved70: filteredData70.filter(row =>
        walkingProgramDepartments.includes(row.unitName) &&
        !mobilityCategories.some(cat => row.mobilityOnAdmissionText?.trim() === cat.text)
      ).length
    });

    this.mobilityAdmissionTableData.push({
      parameter: "סה\"כ",
      internalAndSurgical: this.mobilityAdmissionTableData.reduce((sum, row) => sum + row.internalAndSurgical, 0),
      walkingProgram: this.mobilityAdmissionTableData.reduce((sum, row) => sum + row.walkingProgram, 0),
      walkingProgramAchieved70: this.mobilityAdmissionTableData.reduce((sum, row) => sum + row.walkingProgramAchieved70, 0)
    });

    // 7) Mobility at discharge
    const mobilityDischargeCategories = [
      { text: "לא נייד - 1", label: "1 (אינו נייד כלל)" },
      { text: "מאוד מוגבל - 2", label: "2" },
      { text: "מעט לקויה - 3", label: "3" },
      { text: "מלאה - 4", label: "4 (עצמאי)" }
    ];

    const countByDischargeMobility = (group: any[], mobilityText: string) =>
      group.filter(row => row.comboText15478?.trim() === mobilityText).length;

    this.mobilityDischargeTableData = mobilityDischargeCategories.map(category => ({
      parameter: category.label,
      internalAndSurgical: countByDischargeMobility(
        data.filter(row => internalAndSurgicalDepartments.includes(row.unitName)),
        category.text
      ),
      walkingProgram: countByDischargeMobility(
        data.filter(row => walkingProgramDepartments.includes(row.unitName)),
        category.text
      ),
      walkingProgramAchieved70: countByDischargeMobility(
        this.filteredData.filter(row => 
          walkingProgramDepartments.includes(row.unitName) && row.totalPercentage >= 70
        ),
        category.text
      )
    }));

    const unknownRow = {
      parameter: "לא ידוע",
      internalAndSurgical: data.filter(row =>
        internalAndSurgicalDepartments.includes(row.unitName) &&
        !mobilityDischargeCategories.some(cat => row.comboText15478?.trim() === cat.text)
      ).length,
      walkingProgram: data.filter(row =>
        walkingProgramDepartments.includes(row.unitName) &&
        !mobilityDischargeCategories.some(cat => row.comboText15478?.trim() === cat.text)
      ).length,
      walkingProgramAchieved70: this.filteredData.filter(row =>
        walkingProgramDepartments.includes(row.unitName) &&
        row.totalPercentage >= 70 &&
        !mobilityDischargeCategories.some(cat => row.comboText15478?.trim() === cat.text)
      ).length
    };
    this.mobilityDischargeTableData.push(unknownRow);

    const totalRowDischarge  = {
      parameter: "סה\"כ",
      internalAndSurgical: this.mobilityDischargeTableData
        .filter(row => row.parameter !== "סה\"כ")
        .reduce((sum, row) => sum + row.internalAndSurgical, 0),
      walkingProgram: this.mobilityDischargeTableData
        .filter(row => row.parameter !== "סה\"כ")
        .reduce((sum, row) => sum + row.walkingProgram, 0),
      walkingProgramAchieved70: this.mobilityDischargeTableData
        .filter(row => row.parameter !== "סה\"כ")
        .reduce((sum, row) => sum + row.walkingProgramAchieved70, 0)
    };
    this.mobilityDischargeTableData.push(totalRowDischarge);

    // 8) Mobility change
    const mobilityChangeCategories = [
      { status: "שיפור", label: "שיפור" },
      { status: "ללא שינוי", label: "ללא שינוי" },
      { status: "הדרדרות", label: "הדרדרות" },
      { status: "לא בוצעה הערכת ניידות בשחרור", label: "לא ידוע" }
    ];

    this.mobilityChangeTableData = mobilityChangeCategories.map(category => ({
      parameter: category.label,
      internalAndSurgical: data.filter(row =>
        internalAndSurgicalDepartments.includes(row.unitName) &&
        row.mobilityAssessmentAtDischarge === category.status
      ).length,
      walkingProgram: data.filter(row =>
        walkingProgramDepartments.includes(row.unitName) &&
        row.mobilityAssessmentAtDischarge === category.status
      ).length,
      walkingProgramAchieved70: data.filter(row =>
        walkingProgramDepartments.includes(row.unitName) &&
        row.totalPercentage >= 70 &&
        row.mobilityAssessmentAtDischarge === category.status
      ).length
    }));

    this.mobilityChangeTableData.push({
      parameter: 'סה"כ',
      internalAndSurgical: this.mobilityChangeTableData.reduce((sum, row) => sum + row.internalAndSurgical, 0),
      walkingProgram: this.mobilityChangeTableData.reduce((sum, row) => sum + row.walkingProgram, 0),
      walkingProgramAchieved70: this.mobilityChangeTableData.reduce((sum, row) => sum + row.walkingProgramAchieved70, 0)
    });

    // 9) Basic function before hospitalization
    const basicFunctionCategories = [
      { value: "מרותק", label: "1 (אינו נייד כלל)" },
      { value: "נייד ללא עזרת אדם אחר", label: "2" },
      { value: "נייד עם כיסא גלגלים (ללא עזרת אדם)", label: "3" },
      { value: "נייד עם עזרה", label: "4 (עצמאי)" },
      { value: "אין תיעוד", label: "לא ידוע" }
    ];

    this.mobilityBasicFunctionTableData = basicFunctionCategories.map(category => ({
      parameter: category.label,
      internalAndSurgical: data.filter(row =>
        internalAndSurgicalDepartments.includes(row.unitName) &&
        row.basicFunctionBeforeHospitalization?.trim() === category.value
      ).length,
      walkingProgram: data.filter(row =>
        walkingProgramDepartments.includes(row.unitName) &&
        row.basicFunctionBeforeHospitalization?.trim() === category.value
      ).length,
      walkingProgramAchieved70: data.filter(row =>
        walkingProgramDepartments.includes(row.unitName) &&
        row.totalPercentage >= 70 &&
        row.basicFunctionBeforeHospitalization?.trim() === category.value
      ).length
    }));

    const totalRowBasicFunction = {
      parameter: "סה\"כ",
      internalAndSurgical: this.mobilityBasicFunctionTableData.reduce((sum: number, row: any) => sum + row.internalAndSurgical, 0),
      walkingProgram: this.mobilityBasicFunctionTableData.reduce((sum: number, row: any) => sum + row.walkingProgram, 0),
      walkingProgramAchieved70: this.mobilityBasicFunctionTableData.reduce((sum: number, row: any) => sum + row.walkingProgramAchieved70, 0)
    };
    this.mobilityBasicFunctionTableData.push(totalRowBasicFunction);
  }

  extractYearsAndQuarters(data: any[]) {
    const yearsSet = new Set<number>();
    this.quartersByYear = {};
  
    data.forEach(row => {
      const date = new Date(row.admissionDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
  
      yearsSet.add(year);
  
      let quarter = 1;
      if (month >= 1 && month <= 3) quarter = 1;
      else if (month >= 4 && month <= 6) quarter = 2;
      else if (month >= 7 && month <= 9) quarter = 3;
      else if (month >= 10 && month <= 12) quarter = 4;
  
      if (!this.quartersByYear[year]) {
        this.quartersByYear[year] = [];
      }
  
      if (!this.quartersByYear[year].find(q => q.value === quarter)) {
        this.quartersByYear[year].push({
          value: quarter,
          label:
            quarter === 1 ? 'רבעון 1 (ינואר-מרץ)' :
            quarter === 2 ? 'רבעון 2 (אפריל-יוני)' :
            quarter === 3 ? 'רבעון 3 (יולי-ספטמבר)' :
            'רבעון 4 (אוקטובר-דצמבר)'
        });
      }
    });
  
    const yearsArray = Array.from(yearsSet).sort((a, b) => a - b);
    this.availableYears = [
      { value: null, label: 'ללא' },
      { value: -1, label: 'הכל' },
      ...yearsArray.map(y => ({ value: y, label: y.toString() }))
    ];
  
    this.selectedYear = -1;
    this.updateQuartersForYear();
  }
  
  updateQuartersForYear() {
    if (this.selectedYear === null) {
      this.availableQuarters = [];
      this.selectedQuarter = null;
    } else if (this.selectedYear === -1) {
      const allQuarters = new Set<number>();
      Object.values(this.quartersByYear).forEach((qArr: any) => {
        qArr.forEach((q: any) => allQuarters.add(q.value));
      });
  
      this.availableQuarters = [
        { value: null, label: 'ללא' },
        { value: -1, label: 'הכל' },
        ...Array.from(allQuarters).sort().map(q => ({
          value: q,
          label:
            q === 1 ? 'רבעון 1 (ינואר-מרץ)' :
            q === 2 ? 'רבעון 2 (אפריל-יוני)' :
            q === 3 ? 'רבעון 3 (יולי-ספטמבר)' :
            'רבעון 4 (אוקטובר-דצמבר)'
        }))
      ];
      this.selectedQuarter = -1;
    } else {
      this.availableQuarters = [
        { value: null, label: 'ללא' },
        { value: -1, label: 'הכל' },
        ...(this.quartersByYear[this.selectedYear] || [])
      ];
      this.selectedQuarter = -1;
    }
  }
  
  onYearChange() {
    this.updateQuartersForYear();
  }
}
