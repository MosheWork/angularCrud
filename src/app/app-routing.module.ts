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
  { path: 'dynamicTable', component: DynamicTablesComponent },
  { path: 'ComponentsListInUnits', component: ComponentsListInUnitsComponent },
  { path: 'med-execution-table', component: MedExecutionTableComponent },
  { path: 'medicalDevices', component: MedicalDevicesComponent },
  { path: 'stazerim', component: StazerimComponent },
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

   //chameleon report
   { path: 'PalliativePatients', component: PalliativePatientsComponent },
   { path: 'SkinIntegrityReport', component:SkinIntegrityReportComponent },
   { path: 'patient-guidance-report', component: PatientGuidanceReportComponent },
   { path: 'user-report', component: UsersReportComponent },
   { path: 'SeniorDoctorNotSighned', component: SeniorDoctorNotSighnedComponent },
   { path: 'UserLogPerCaseNumberReport', component: UserLogPerCaseNumberReportComponent },
   { path: 'icd9-report', component: Icd9ReportComponent },
   { path: 'ssri-protocol', component: SSRIProtocolComponent },
   { path: 'hemo-dialysis', component: HemoDialysisReportComponent },

//shift-table
   { path: 'shift-table', component: ShiftTableComponent },
   { path: 'shift-calendar', component: ShiftCalendarComponent }
];

@NgModule({
  imports: [CommonModule, RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [{ provide: LocationStrategy, useClass: HashLocationStrategy }],
})
export class AppRoutingModule {}
