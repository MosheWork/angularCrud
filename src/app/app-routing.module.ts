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

   //Reports report
   { path: 'PalliativePatients', component: PalliativePatientsComponent },// לא בשימוש
   { path: 'med-execution-table', component: MedExecutionTableComponent },// דוח ביצוע תרופות לבית מרקחת
   { path: 'SkinIntegrityReport', component:SkinIntegrityReportComponent },//אומדן שלמות העור
   { path: 'patient-guidance-report', component: PatientGuidanceReportComponent },//דוח הנחיות למטופלים
   { path: 'user-report', component: UsersReportComponent },//רשימת עובדים עם תאריך התחברות אחרונה
   { path: 'SeniorDoctorNotSighned', component: SeniorDoctorNotSighnedComponent },// לא בשימוש -  דוח רופאים בכירים שלא חתמו
   { path: 'UserLogPerCaseNumberReport', component: UserLogPerCaseNumberReportComponent },//בטיחות הטיפול - לוגים קמיליון
   { path: 'icd9-report', component: Icd9ReportComponent },// חיפוש מטופלים על פי קוד ICD 9
   { path: 'ssri-protocol', component: SSRIProtocolComponent },// צטופלים שהופעלה להם הוראה קלינית SSRI
   { path: 'hemo-dialysis', component: HemoDialysisReportComponent },// דוח לדיאליזה
   { path: 'SearchByCaseNumber', component: SearchByCaseNumberComponent },//חיפוש על פי מספרי מקרה-מחלקה משחררת
   { path: 'palliative-patients-report', component: PalliativePatientsReportComponent },// מטופלים פליאטים לרווטיל
   { path: 'GeriatricsDrugsOnVacation', component: GeriatricsDrugsOnVacationComponent },//דוח תרופות לחולים גריאטרים שיוצאים לחופשה - עוד לא אושר
   { path: 'stazerim', component: StazerimComponent },//דוח הרשאות לסטזארים
   { path: 'dynamicTable', component: DynamicTablesComponent },//רשימת טבלאות דינמאיות של הקמיליון
   { path: 'medicalDevices', component: MedicalDevicesComponent },//רשימת מכשירים בקמיליון
   { path: 'ComponentsListInUnits', component: ComponentsListInUnitsComponent },//רכיבים בקמיליון
   { path: 'DrugsReport', component: DrugsReportComponent },//לורדית דוח של מטופלות עם תרופות קבועות או פעילות על פי קודים של יולדות
   { path: 'epidemiological-investigation', component: EpidemiologicalInvestigationComponent },//חקירה אפידמיולוגית ליחידה למניעת זיהומים
   { path: 'drug2h-review', component: Drug2hReviewComponent },//דוח לקרן בדיקה אם כל שעתיים אחות עשתה בקרה על תרופה ברת סיכון
   { path: 'diabetes-consultation', component: DiabetesConsultationComponent },//דוח סכרת לליך שביט
   { path: 'er-info', component: ERInfoComponent },//דוח מיון לעידן

//chemelondashboard
{ path: 'DepartmentCapacity', component: DepartmentCapacityComponent }, // פרוייקט אישי
//shift-table
   { path: 'shift-table', component: ShiftTableComponent },
   { path: 'shift-calendar', component: ShiftCalendarComponent },

   //amin
   { path: 'aws', component: AwsClaudeInvocationComponent },

];

@NgModule({
  imports: [CommonModule, RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [{ provide: LocationStrategy, useClass: HashLocationStrategy }],
})
export class AppRoutingModule {}
