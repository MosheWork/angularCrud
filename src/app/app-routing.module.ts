import { CommonModule } from '@angular/common';
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

const routes: Routes = [
  { path: 'users', component: UsersComponent },
  { path: 'sql', component: SQLComponent },
  { path: 'MainPageReports', component: MainPageReportsComponent },
  { path: 'reports-permissions', component: ReportsPermissionsComponent },
  { path: 'UserDashboard', component: UserDashboardComponent },
  { path: 'AdminDashboard', component: AdminDashboardComponent },
  { path: 'ApplicationList', component: ApplicationsListComponent },
  { path: 'contacts', component: ContactsComponent },
  { path: 'contacts/:applicationID', component: ContactsComponent }, // Add this line
  { path: 'dynamicTable', component: DynamicTablesComponent },
  { path: 'ComponentsListInUnits', component: ComponentsListInUnitsComponent },
  { path: 'med-execution-table', component: MedExecutionTableComponent },
  { path: 'medicalDevices', component: MedicalDevicesComponent },
  { path: 'stazerim', component: StazerimComponent },
  { path: 'SysAid', component: SysAidComponent },
  { path: 'sys-graph', component: SysGraphComponent },
  { path: 'MainServiceCallsScreen', component: MainServiceCallsScreenComponent },
  { path: 'serviceCallsScreenIt', component: ServiceCallsScreenITComponent },
  { path: 'AdminHomePage', component: AdminHomePageComponent },
  { path: 'GuidesList', component: GuidesListComponent },
  { path: 'NewGuid', component: NewGuideFormComponent },
  { path: 'guide/:id', component: ViewGuideComponent },
  { path: 'Editguide/:id', component: EditGuideFormComponent },
  { path: 'ServersStatus', component: ServerPingCheckAppComponent },
  { path: 'manage-servers', component: ManageServersComponent },
  { path: 'departmentLoadDashboard', component: DepartmentLoadDashboardComponent },
  { path: 'department-detail/:id', component: DepartmentDetailDialogComponent },
  { path: 'current-patients', component: CurrentPatientsComponent },
  { path: '', redirectTo: '/applications', pathMatch: 'full' }
];

@NgModule({
  imports: [CommonModule, RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
