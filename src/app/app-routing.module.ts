import { CommonModule } from '@angular/common';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UsersComponent } from './users/users.component';
import { SQLComponent } from './sql/sql.component';
import { MainPageReportsComponent } from './main-page-reports/main-page-reports.component';
import { ReportsPermissionsComponent } from './reports-permissions/reports-permissions.component';
import { UserDashboardComponent } from './user-dashboard/user-dashboard.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { ApplicationsListComponent } from './contacts/applications-list/applications-list.component';
import { ContactsComponent } from './contacts/contacts.component';
import { DynamicTablesComponent } from './chameleon-reports/dynamic-tables/dynamic-tables.component';
import { ComponentsListInUnitsComponent } from './chameleon-reports/components-list-in-units/components-list-in-units.component';
import { MedExecutionTableComponent } from './chameleon-reports/med-execution-table/med-execution-table.component';
import { MedicalDevicesComponent } from './chameleon-reports/moshe-reports/medical-devices/medical-devices.component';
import { StazerimComponent } from './chameleon-reports/moshe-reports/stazerim/stazerim.component';
import { SysAidComponent } from './sys-aid/sys-aid.component';
import { SysGraphComponent } from './sys-aid/sys-graph/sys-graph.component';
import { MainServiceCallsScreenComponent } from './serviceCalls/main-service-calls-screen/main-service-calls-screen.component';
import { ServiceCallsScreenITComponent } from './serviceCalls/service-calls-screen-it/service-calls-screen-it.component';
import { AdminHomePageComponent } from './admin-home-page/admin-home-page.component';
import { GuidesListComponent } from './Guides/guides-list/guides-list.component';
import { NewGuideFormComponent } from './Guides/new-guide-form/new-guide-form.component';
import { ViewGuideComponent } from './Guides/view-guide/view-guide.component';
import { EditGuideFormComponent } from './Guides/edit-guide-form/edit-guide-form.component';
import { ServerPingCheckAppComponent } from './server-ping-check-app/server-ping-check-app.component';
import { ManageServersComponent } from './server-ping-check-app/manage-servers/manage-servers.component';
import { DepartmentLoadDashboardComponent } from './departmentLoad/department-load-dashboard/department-load-dashboard.component';
import { DepartmentDetailDialogComponent } from './departmentLoad/department-detail/department-detail.component';
import { CurrentPatientsComponent } from './departmentLoad/current-patients/current-patients.component';
import { ShiftManagementComponent } from './shift-management/shift-management/shift-management.component';
import { BoardsComponent } from './Monday/boards/boards.component';
import { TasksComponent } from './Monday/tasks/tasks.component';
import { TaskSummaryComponent } from './Monday/task-summary/task-summary.component';
import { TaskListComponent } from './Ilana/task-list/task-list.component';
import { AddTaskComponent } from './Ilana/add-task/add-task.component';
import { GuideListComponent } from './GuidesNew/guide-list/guide-list.component';
import { UploadGuideComponent } from './GuidesNew/upload-guide/upload-guide.component';
import { PalliativePatientsComponent } from './chameleon-reports/palliative-patients/palliative-patients.component';
import { SkinIntegrityReportComponent } from './chameleon-reports/skin-integrity-report/skin-integrity-report.component';
import { PatientGuidanceReportComponent } from './chameleon-reports/patient-guidance-report/patient-guidance-report.component';
import { UsersReportComponent } from './chameleon-reports/users-report/users-report.component';
import { SeniorDoctorNotSighnedComponent } from './chameleon-reports/senior-doctor-not-sighned-component/senior-doctor-not-sighned-component.component';
import { UserLogPerCaseNumberReportComponent } from './chameleon-reports/user-log-per-case-number-report/user-log-per-case-number-report.component';
import { ShiftTableComponent } from './shift-table/shift-table.component';
import { ShiftCalendarComponent } from './shift-calendar/shift-calendar.component';
import { Icd9ReportComponent } from './chameleon-reports/icd9-report/icd9-report.component';
import { SSRIProtocolComponent } from './chameleon-reports/ssriprotocol/ssriprotocol.component';
import { HemoDialysisReportComponent } from './chameleon-reports/hemo-dialysis-report/hemo-dialysis-report.component';
import { SearchByCaseNumberComponent } from './chameleon-reports/search-by-case-number/search-by-case-number.component';
import { PalliativePatientsReportComponent } from './chameleon-reports/palliative-patients-report/palliative-patients-report.component';
import { GeriatricsDrugsOnVacationComponent } from './chameleon-reports/geriatrics-drugs-on-vacation-component/geriatrics-drugs-on-vacation-component.component';
import { DrugsReportComponent } from './chameleon-reports/drugs-report-component/drugs-report-component.component';
import { EpidemiologicalInvestigationComponent } from './chameleon-reports/epidemiological-investigation/epidemiological-investigation.component';
import { DepartmentCapacityComponent } from './chameleonDashboard/department-capacity/department-capacity.component';
import { Drug2hReviewComponent } from './chameleon-reports/drug2h-review/drug2h-review.component';
import { DiabetesConsultationComponent } from './chameleon-reports/diabetes-consultation/diabetes-consultation.component';
import { AwsClaudeInvocationComponent } from './aws-claude-invocation/aws-claude-invocation.component';
import { ERInfoComponent } from './chameleon-reports/erinfo/erinfo.component';
import { CommunicationTherapistComponent } from './chameleon-reports/communication-therapist/communication-therapist.component';
import { VWInfectionControlICUComponent } from './chameleon-reports/vwinfection-control-icu/vwinfection-control-icu.component';
import { DepartmentOccupiedMitavComponent } from './chameleon-reports/department-occupied-mitav/department-occupied-mitav.component';
import { MitavMobilityComponent } from './mitav/mitav-mobility/mitav-mobility.component';
import { MitavDeliriumComponent } from './mitav/mitav-delirium/mitav-delirium.component';
import { TraumaPatientsComponent } from './chameleon-reports/trauma-patients/trauma-patients.component';
import { ERdashboardComponent } from './chameleon-reports/erdashboard/erdashboard.component';
import { DementiaPatientsComponent } from './chameleon-reports/dementia-patients/dementia-patients.component';
import { CameleonNoCaseNumberReasonsComponent } from './chameleon-reports/cameleon-no-case-number-reasons/cameleon-no-case-number-reasons.component';
import { MosheOnlineLogsComponent } from './chameleon-reports/moshe-online-logs/moshe-online-logs.component';
import { HospPhoneByDepartmentComponent } from './chameleon-reports/hosp-phone-by-department/hosp-phone-by-department.component';
import { MitavDeliriumForDepartmentComponent } from './mitav/mitav-delirium/mitav-delirium-for-department/mitav-delirium-for-department.component';
import { MitavGeriatricForDepartmentComponent } from './mitav/mitav-geriatric-for-department/mitav-geriatric-for-department.component';
import { MitavGeriatricComponent } from './mitav/mitav-geriatric/mitav-geriatric.component';
import { MItavMainPageComponent } from './mitav/mitav-main-page/mitav-main-page.component';
import { SkinIntegrityDashboardComponent } from './chameleon-reports/skin-integrity-dashboard/skin-integrity-dashboard.component';
import { UserCRMComponent } from './ServiceCRM/user-crm/user-crm.component';
import { MitavSummaryComponent } from './mitav/mitav-summary/mitav-summary.component';
import { AdminCrmComponent } from './ServiceCRM/admin-crm/admin-crm.component';
import { MitavSummaryDeliriumComponent } from './mitav/mitav-summary-delirium/mitav-summary-delirium.component';
import { OccupationalTherapyComponent } from './chameleon-reports/occupational-therapy/occupational-therapy.component';
import { MainScreenComponent } from './ServiceCRM/main-screen/main-screen.component';
import { BirthdayUpdateCRMComponent } from './ServiceCRM/birthday-update-crm/birthday-update-crm.component';
import { QuestionnaireRemarksComponent } from './ServiceCRM/questionnaire-remarks/questionnaire-remarks.component';
import { PhysiotherapyComponent } from './chameleon-reports/physiotherapy/physiotherapy.component';
import { ProductivityReportsComponent } from './chameleon-reports/productivity-reports/productivity-reports.component';
import { MeasurementDataMosheComponent } from './MARAA/measurement-data-moshe/measurement-data-moshe.component';
import { MeasurementTargetManagerComponent } from './MARAA/measurement-target-manager/measurement-target-manager.component';
import { SpinnerScreenComponent } from './MARAA/spinner-screen/spinner-screen.component';
import { MeasurementDefComponent } from './MARAA/measurement-def/measurement-def.component';
import { MaccabiTelAvivComponent } from './maccabi-tel-aviv/maccabi-tel-aviv.component';
import { PhysioEquipmentReportComponent } from './chameleon-reports/physio-equipment-report/physio-equipment-report.component';
import { NutritionistReportComponent } from './chameleon-reports/nutritionist-report/nutritionist-report.component';
import { DrugSurgeryReportComponent } from './chameleon-reports/drug-surgery-report/drug-surgery-report.component';
import { PCIreportComponent } from './chameleon-reports/pci-report/pci-report.component';
import { ApplicationsComponent } from './applications-component/applications-component.component';
import { GuideManagerComponent } from './guide-manager/guide-manager.component';
import { BreastfeedingCoordinatorComponent } from './chameleon-reports/breastfeeding-coordinator/breastfeeding-coordinator.component';
import { MedicationReconciliationComponent } from './chameleon-reports/medication-reconciliation/medication-reconciliation.component';
import { ApplicationsListDeptComponent } from './ApplicationsListDept/applications-list-dept/applications-list-dept.component';

const routes: Routes = [
  { path: 'users', component: UsersComponent },
  { path: 'sql', component: SQLComponent },
  { path: 'MainPageReports', component: MainPageReportsComponent },
  { path: 'reports-permissions', component: ReportsPermissionsComponent },
  { path: 'UserDashboard', component: UserDashboardComponent },
  { path: 'AdminDashboard', component: AdminDashboardComponent },
  { path: 'ApplicationList', component: ApplicationsListComponent },
  { path: 'applications', component: ApplicationsListComponent },
  { path: 'contacts', component: ContactsComponent },
  { path: 'contacts/:applicationID', component: ContactsComponent }, // Add this line
  

  { path: 'SysAid', component: SysAidComponent },
  { path: 'sys-graph', component: SysGraphComponent },
  {
    path: 'MainServiceCallsScreen',
    component: MainServiceCallsScreenComponent,
  },
  { path: 'serviceCallsScreenIt', component: ServiceCallsScreenITComponent },
  { path: 'AdminHomePage', component: AdminHomePageComponent },
  { path: 'GuidesList', component: GuidesListComponent },
  { path: 'NewGuid', component: NewGuideFormComponent },
  { path: 'guide/:id', component: ViewGuideComponent },
  { path: 'Editguide/:id', component: EditGuideFormComponent },
  { path: 'ServersStatus', component: ServerPingCheckAppComponent },
  { path: 'manage-servers', component: ManageServersComponent },
  {
    path: 'departmentLoadDashboard',
    component: DepartmentLoadDashboardComponent,
  },
  { path: 'department-detail/:id', component: DepartmentDetailDialogComponent },
  { path: 'current-patients', component: CurrentPatientsComponent },
  { path: '', redirectTo: '/applications', pathMatch: 'full' },

  // shift
  { path: 'shifts', component: ShiftManagementComponent },

  //monday
  { path: 'boards', component: BoardsComponent },
  { path: 'boards/:boardId/tasks', component: TasksComponent },
  { path: '', redirectTo: '/boards', pathMatch: 'full' },
  { path: 'taskSummary', component: TaskSummaryComponent },

  //ilana
  { path: 'Ilanatasks', component: TaskListComponent },
  { path: 'Ilanatasks-add-task', component: AddTaskComponent },

  //guide new
  { path: 'guideList', component: GuideListComponent },
  { path: 'NewGuide', component: UploadGuideComponent },

  
// Reports report
  { path: 'PalliativePatients', component: PalliativePatientsComponent, data: { title: 'לא בשימוש' }}, // לא בשימוש
  { path: 'med-execution-table', component: MedExecutionTableComponent, data: { title: 'דוח ביצוע תרופות לבית מרקחת' }}, // דוח ביצוע תרופות לבית מרקחת
  { path: 'SkinIntegrityReport', component: SkinIntegrityReportComponent, data: { title: 'אומדן שלמות העור' }}, // אומדן שלמות העור
  { path: 'patient-guidance-report', component: PatientGuidanceReportComponent, data: { title: 'דוח הנחיות למטופלים' }}, // דוח הנחיות למטופלים
  { path: 'user-report', component: UsersReportComponent, data: { title: 'רשימת עובדים עם תאריך התחברות אחרונה' }}, // רשימת עובדים עם תאריך התחברות אחרונה
  { path: 'SeniorDoctorNotSighned', component: SeniorDoctorNotSighnedComponent, data: { title: 'לא בשימוש - דוח רופאים בכירים שלא חתמו' }}, // לא בשימוש - דוח רופאים בכירים שלא חתמו
  { path: 'UserLogPerCaseNumberReport', component: UserLogPerCaseNumberReportComponent, data: { title: 'בטיחות הטיפול - לוגים קמיליון' }}, // בטיחות הטיפול - לוגים קמיליון
  { path: 'icd9-report', component: Icd9ReportComponent, data: { title: 'חיפוש מטופלים על פי קוד ICD 9' }}, // חיפוש מטופלים על פי קוד ICD 9
  { path: 'ssri-protocol', component: SSRIProtocolComponent, data: { title: 'צטופלים שהופעלה להם הוראה קלינית SSRI' }}, // צטופלים שהופעלה להם הוראה קלינית SSRI
{ path: 'hemo-dialysis', component: HemoDialysisReportComponent, data: { title: 'דוח לדיאליזה' }}, // דוח לדיאליזה
{ path: 'SearchByCaseNumber', component: SearchByCaseNumberComponent, data: { title: 'חיפוש על פי מספרי מקרה-מחלקה משחררת' }}, // חיפוש על פי מספרי מקרה-מחלקה משחררת
{ path: 'palliative-patients-report', component: PalliativePatientsReportComponent, data: { title: 'מטופלים פליאטים ' }}, // מטופלים פליאטים לרווטיל
{ path: 'GeriatricsDrugsOnVacation', component: GeriatricsDrugsOnVacationComponent, data: { title: 'דוח תרופות לחולים גריאטרים שיוצאים לחופשה ' }}, // דוח תרופות לחולים גריאטרים שיוצאים לחופשה - עוד לא אושר
{ path: 'stazerim', component: StazerimComponent, data: { title: 'דוח הרשאות לסטזארים' }}, // דוח הרשאות לסטזארים
{ path: 'dynamicTable', component: DynamicTablesComponent, data: { title: 'רשימת טבלאות דינמאיות של הקמיליון' }}, // רשימת טבלאות דינמאיות של הקמיליון
{ path: 'medicalDevices', component: MedicalDevicesComponent, data: { title: 'רשימת מכשירים בקמיליון' }}, // רשימת מכשירים בקמיליון
{ path: 'ComponentsListInUnits', component: ComponentsListInUnitsComponent, data: { title: 'רכיבים בקמיליון' }}, // רכיבים בקמיליון
{ path: 'DrugsReport', component: DrugsReportComponent, data: { title: ' דוח של מטופלות עם תרופות קבועות או פעילות על פי קודים של יולדות' }}, // לורדית דוח של מטופלות עם תרופות קבועות או פעילות על פי קודים של יולדות
{ path: 'epidemiological-investigation', component: EpidemiologicalInvestigationComponent, data: { title: 'חקירה אפידמיולוגית ליחידה למניעת זיהומים' }}, // חקירה אפידמיולוגית ליחידה למניעת זיהומים
{ path: 'drug2h-review', component: Drug2hReviewComponent, data: { title: 'דוח בקרת תרופות ברות סיכון' }}, // דוח לקרן בדיקה אם כל שעתיים אחות עשתה בקרה על תרופה ברת סיכון
{ path: 'diabetes-consultation', component: DiabetesConsultationComponent, data: { title: 'דאשבורד סכרת' }}, // דוח סכרת לליך שביט
{ path: 'er-info', component: ERInfoComponent, data: { title: 'דוח מיון ' }}, // דוח מיון לעידן
{ path: 'CommunicationTherapist', component: CommunicationTherapistComponent, data: { title: 'דוח קלינאית תקשורת ' }}, // דוח קלינאית תקשורת לבתאל
{ path: 'vwinfection-control-icu', component: VWInfectionControlICUComponent, data: { title: 'דוח  מחלות זיהומיות  ' }}, // דוח להיבה מחלות זיהומיות שאילתא מאופיר
{ path: 'DepartmentOccupiedMitav', component: DepartmentOccupiedMitavComponent, data: { title: 'דוח תפוסה ניידות' }}, // דוח תפוסה מיטבית
{ path: 'TraumaPatients', component: TraumaPatientsComponent , data: { title: 'מטופלי טראומה' }},// מטופלי טרואמה מאופיר
{ path: 'ERdashboard', component: ERdashboardComponent , data: { title: 'דאשבורד למיון' }},// דאשבורד למיון
{ path: 'dementia-patients', component: DementiaPatientsComponent , data: { title: 'מטופלים דימנטים ' }},// מטופלים דימנטים לרויטל
{ path: 'CameleonNoCaseNumberReasons', component: CameleonNoCaseNumberReasonsComponent , data: { title: 'מטופלים ללא מספר מקרה' }},// מטופלים  ללא מספרי מקרה לדלאשה   
{ path: 'MosheOnlineLogs', component: MosheOnlineLogsComponent , data: { title: ' לוגים' }},// פרויקט אישי לוגים
{ path: 'HospPhoneByDepartment', component: HospPhoneByDepartmentComponent , data: { title: 'רשימת טלפונים' }},// טלפונים של מאושפזים למאיר  
{ path: 'SkinIntegrityDashboard', component: SkinIntegrityDashboardComponent , data: { title: ' דאשבורד שלמות העור' }},// דאשבורד לדיאנה לאומדן שלמות העור  
{ path: 'occupational-therapy', component: OccupationalTherapyComponent , data: { title: ' דאשבורד ריפוי בעיסוק' }},// - לוצ רך חישוב פרמייה דאשבורד לרוני צור סהר ריפוי ועיסוק     
{ path: 'Physiotherapy', component: PhysiotherapyComponent , data: { title: 'פיזותרפיה' }},// דוח תפוקות פיזותרפיה של עופר    
{ path: 'ProductivityReports', component: ProductivityReportsComponent , data: { title: 'דוח תפוקות' }},// דוח תפוקות  של פרא רפואי     
{ path: 'physio-equipment-report', component: PhysioEquipmentReportComponent , data: { title: 'פיזותרפיה השאלת ציוד ' }},// דוח תפוקות  של פרא רפואי     
{ path: 'nutritionist-report', component: NutritionistReportComponent , data: { title: 'דוח תפוקות - תזונה' }},// דוח תפוקות  של פרא רפואי     
{ path: 'drug-surgery-report', component: DrugSurgeryReportComponent , data: { title: 'אנטיביוטיקה מניעתית לפני ניתוח' }},//    של היבה         
{ path: 'PCIreportComponent', component: PCIreportComponent , data: { title: ' PCI' }},//    לבקשת אופיר       
{ path: 'breastfeeding-coordinator', component: BreastfeedingCoordinatorComponent , data: { title: ' מתאמת הנקה ' }},//   מתאמת הנקה      
{ path: 'medication-reconciliationr', component: MedicationReconciliationComponent , data: { title: 'MedicationReconciliation' }},//  MedicationReconciliation 


//chemelondashboard
   { path: 'DepartmentCapacity', component: DepartmentCapacityComponent }, // פרוייקט אישי
//shift-table
   { path: 'shift-table', component: ShiftTableComponent },
   { path: 'shift-calendar', component: ShiftCalendarComponent },

   // דוח מיתב
   { path: 'MitavMobility', component: MitavMobilityComponent , data: { title: 'מיתב ניידות' }},
   { path: 'MitavDelirium', component: MitavDeliriumComponent , data: { title: 'מיתב דליריום' }},
   { path: 'mitav-delirium-for-department', component: MitavDeliriumForDepartmentComponent , data: { title: ' דו"ח דליריום למחלקה' }},
   { path: 'mitav-geriatric-for-department', component: MitavGeriatricForDepartmentComponent , data: { title: ' דו"ח גריאטריה למחלקה' }},
   { path: 'mitav-geriatric', component: MitavGeriatricComponent , data: { title: ' מיתב דאשבורד גריאטריה' }},
   { path: 'mitav-main-page', component: MItavMainPageComponent , data: { title: ' מיתב דף הבית' }},
   { path: 'mitav-summary', component: MitavSummaryComponent , data: { title: ' ניידות סיכום ' }},
   { path: 'MitavSummaryDelirium', component: MitavSummaryDeliriumComponent , data: { title: ' דליריום סיכום ' }},



   //CRM למיכל
   { path: 'UserCRM', component: UserCRMComponent , data: { title: ' דאשבורד נציג - CRM  ' }},
   { path: 'AdminCrm', component: AdminCrmComponent , data: { title: ' דאשבורד מנהל - CRM  ' }},
   { path: 'CRMmain', component: MainScreenComponent , data: { title: 'מסך הבית ' }},
   { path: 'BirthdayUpdateCRM', component: BirthdayUpdateCRMComponent , data: { title: 'מסך יומלדת ' }},
   { path: 'questionnaire-remarks', component: QuestionnaireRemarksComponent , data: { title: 'מערכת ניהול תגובות' }},



   //amin
   { path: 'aws', component: AwsClaudeInvocationComponent },

   
   //מערכת מראה
   { path: 'measurement-data', component: MeasurementDataMosheComponent, data: { title: 'פרוייקט מרא"ה ' }},
   { path: 'measurement-targets', component: MeasurementTargetManagerComponent , data: { title: 'פרוייקט מרא"ה - עדכון יעדים ' }},
   { path: 'SpinnerScreen', component: SpinnerScreenComponent , data: { title: 'פרוייקט מרא"ה   ' }},
   { path: 'MeasurementDef', component: MeasurementDefComponent , data: { title: 'פרוייקט מרא"ה - עדכון מדדים   ' }},

//מכבי תל אביב לצביקה
{ path: 'maccabi-tel-aviv', component: MaccabiTelAvivComponent , data: { title: 'מכבי תל אביב' }},

// מערכת לקישורים לתיקיות 
{ path: 'ApplicationsComponent', component: ApplicationsComponent , data: { title: ' קישורים חשובים של מערכות ' }},

// ניהול ידע
{ path: 'app-guide-manager', component: GuideManagerComponent , data: { title: 'רשימת יישומים' }},
{ path: 'applications-list-dept', component: ApplicationsListDeptComponent , data: { title: 'רשימת יישומים' }}
];

@NgModule({
  imports: [CommonModule, RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [{ provide: LocationStrategy, useClass: HashLocationStrategy }],
})
export class AppRoutingModule {}
