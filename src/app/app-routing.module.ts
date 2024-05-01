import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { HosListComponent } from './old/hos-list/hos-list.component';
import { MychartComponent } from './mychart/mychart.component';
import { UsersComponent } from './users/users.component';
import { UploadPicComponent } from './upload-pic/upload-pic.component';
import { SQLComponent } from './sql/sql.component';
import { ConsiliumsComponent } from './consiliums/consiliums.component';
import { YourTableComponentComponent } from './your-table-component/your-table-component.component';
import { IsolationComponent } from './isolation/isolation.component';
import { HospitalizationsListComponent } from './hospitalizations-list/hospitalizations-list.component';
import { DevicesPerUnitComponent } from './devices-per-unit/devices-per-unit.component';
import { MedicalDevicesComponent } from './chameleon-reports/moshe-reports/medical-devices/medical-devices.component';
import { SysAidComponent } from './sys-aid/sys-aid.component';
import { MainPageReportsComponent } from './main-page-reports/main-page-reports.component';
import { SysGraphComponent } from './sys-aid/sys-graph/sys-graph.component';
import { ReportsPermissionsComponent } from './reports-permissions/reports-permissions.component';
import { CatheterComponent } from './chameleon-reports/catheter/catheter.component';
import { StazerimComponent } from './chameleon-reports/moshe-reports/stazerim/stazerim.component';
import { UserDashboardComponent } from './user-dashboard/user-dashboard.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { MainServiceCallsScreenComponent } from './serviceCalls/main-service-calls-screen/main-service-calls-screen.component';
import { ServiceCallsScreenITComponent } from './serviceCalls/service-calls-screen-it/service-calls-screen-it.component';
import { AdminHomePageComponent } from './admin-home-page/admin-home-page.component';
import { GuidesListComponent } from './Guides/guides-list/guides-list.component';
import { NewGuideFormComponent } from './Guides/new-guide-form/new-guide-form.component';
import { ViewGuideComponent } from './Guides/view-guide/view-guide.component';
import { EditGuideFormComponent } from './Guides/edit-guide-form/edit-guide-form.component';

const routes: Routes = [
  { path: 'users', component: UsersComponent },
  { path: 'home', component: AppComponent },
  { path: 'HospitalizationsList', component: HospitalizationsListComponent },
  { path: 'chart', component: MychartComponent },
  { path: 'uploadPic', component: UploadPicComponent },
  { path: 'sql', component: SQLComponent },

  { path: 'Consiliums', component: ConsiliumsComponent },
  { path: 'Isolation', component: IsolationComponent },
  { path: 'DevicesPerUnit', component: DevicesPerUnitComponent },
  { path: 'Test', component: YourTableComponentComponent },
  { path: 'MainPageReports', component: MainPageReportsComponent },
  { path: 'reports-permissions', component: ReportsPermissionsComponent },
  { path: 'UserDashboard', component: UserDashboardComponent },
  { path: 'AdminDashboard', component: AdminDashboardComponent },

  // chameleon report
  { path: 'catheter', component: CatheterComponent },

  //moshe-reports
  { path: 'medicalDevices', component: MedicalDevicesComponent },
  { path: 'stazerim', component: StazerimComponent },
  //sysreports
  { path: 'SysAid', component: SysAidComponent },
  { path: 'sys-graph', component: SysGraphComponent },


  //service calls
  { path: 'MainServiceCallsScreen', component: MainServiceCallsScreenComponent },
  { path: 'serviceCallsScreenIt', component: ServiceCallsScreenITComponent },


  //AdminHomePage
  { path: 'AdminHomePage', component: AdminHomePageComponent },

  
  //guides
  { path: 'GuidesList', component: GuidesListComponent },
  { path: 'NewGuid', component: NewGuideFormComponent },
  { path: 'guide/:id', component: ViewGuideComponent },
  { path: 'Editguide/:id', component: EditGuideFormComponent }






];

@NgModule({
  imports: [CommonModule, RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
